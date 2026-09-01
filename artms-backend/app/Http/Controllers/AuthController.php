<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\AuditLog;
use App\Models\AuthenticationOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Determine if a user requires OTP verification for login.
     * Only the specified default credentials bypass OTP verification.
     * All newly created or other user accounts (regardless of role) strictly require OTP verification.
     */
    protected function requiresLoginOtp(User $user): bool
    {
        // Specific hardcoded credentials exempt from OTP
        $exemptEmails = [
            'superadmin@artms.com',
            'developer@artms.com',
            'hradmin@artms.com',
            'coo@artms.com',
            'depthead@artms.com',
            'interviewer@artms.com',
            'employee@artms.com',
        ];

        return ! in_array(strtolower(trim((string) $user->email)), $exemptEmails, true);
    }

    /**
     * Mask an email address for privacy (e.g., j***e@example.com).
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $name = $parts[0] ?? '';
        $domain = $parts[1] ?? 'example.com';

        if (strlen($name) <= 2) {
            $maskedName = substr($name, 0, 1) . '*';
        } else {
            $maskedName = substr($name, 0, 1) . str_repeat('*', max(1, strlen($name) - 2)) . substr($name, -1);
        }

        return $maskedName . '@' . $domain;
    }

    /**
     * POST /api/auth/login or /api/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $email = is_string($request->email) ? trim($request->email) : $request->email;
        $password = is_string($request->password) ? trim($request->password) : $request->password;

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // ── 1. DIRECT LOGIN EXEMPTION (No OTP required for SuperAdmin, HR, Dept Head) ──
        if (! $this->requiresLoginOtp($user)) {
            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);

            $user->tokens()->delete();
            $token = $user->createToken('artms-token')->plainTextToken;

            AuditLog::record('login', 'auth', "User {$user->email} ({$user->role}) logged in directly without OTP.");

            return response()->json([
                'message'      => 'Login successful.',
                'requires_otp' => false,
                'token'        => $token,
                'user'         => [
                    'id'            => $user->id,
                    'name'          => $user->name,
                    'email'         => $user->email,
                    'avatar'        => $user->avatar,
                    'role'          => $user->role,
                    'department_id' => $user->department_id,
                    'employee_id'   => $user->employee_id,
                ],
            ]);
        }

        // ── 2. NON-SUPER-ADMIN USERS (Require Login OTP Verification) ──────────
        $otpData = AuthenticationOtp::createLoginOtp($user);
        $otp = $otpData['otp'];
        $verificationId = $otpData['verification_id'];

        // Send OTP to registered email
        try {
            Mail::send('emails.login_otp', ['otp' => $otp, 'user' => $user], function ($mail) use ($user) {
                $mail->to($user->email)
                     ->subject('ARTMS — Your Login Verification Code');
            });
        } catch (\Throwable $e) {
            \Log::error("Failed to send login OTP email to {$user->email}: " . $e->getMessage());
        }

        AuditLog::record('login_otp_sent', 'auth', "Login OTP generated and sent to {$user->email}.");

        return response()->json([
            'requires_otp'    => true,
            'message'         => 'A verification code has been sent to your registered email address.',
            'verification_id' => $verificationId,
            'email_hint'      => $this->maskEmail($user->email),
            'expires_in'      => AuthenticationOtp::EXPIRY_MINUTES * 60,
            'resend_cooldown' => AuthenticationOtp::RESEND_COOLDOWN_SECONDS,
        ]);
    }

    /**
     * POST /api/auth/verify-login-otp
     */
    public function verifyLoginOtp(Request $request): JsonResponse
    {
        $request->validate([
            'verification_id' => ['required', 'string'],
            'otp'             => ['required', 'string', 'size:6'],
        ]);

        $record = AuthenticationOtp::where('verification_id', $request->verification_id)
            ->where('purpose', 'login_verification')
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'Invalid or expired verification session. Please log in again.',
            ], 422);
        }

        if ($record->isUsed()) {
            return response()->json([
                'message' => 'This verification code has already been used. Please log in again.',
            ], 422);
        }

        if ($record->isExpired()) {
            $record->update(['used_at' => now()]);
            AuditLog::record('login_otp_expired', 'auth', "Expired OTP attempt for user ID {$record->user_id}.");

            return response()->json([
                'message' => 'Verification code has expired. Please request a new code or log in again.',
            ], 422);
        }

        if ($record->hasExceededAttempts()) {
            $record->update(['used_at' => now()]);
            AuditLog::record('login_otp_failed', 'auth', "Max OTP attempts exceeded for user ID {$record->user_id}.");

            return response()->json([
                'message' => 'Too many failed verification attempts. Please log in again.',
            ], 422);
        }

        if (! $record->isValid($request->otp)) {
            $record->increment('attempts');
            $remaining = AuthenticationOtp::MAX_ATTEMPTS - $record->attempts;

            AuditLog::record('login_otp_failed', 'auth', "Incorrect OTP entered for user ID {$record->user_id}. Attempts left: {$remaining}");

            if ($remaining <= 0) {
                $record->update(['used_at' => now()]);
                return response()->json([
                    'message' => 'Too many failed verification attempts. Please log in again.',
                ], 422);
            }

            return response()->json([
                'message' => "Invalid verification code. {$remaining} attempt(s) remaining.",
                'remaining_attempts' => $remaining,
            ], 422);
        }

        // Mark OTP as used
        $record->update(['used_at' => now()]);

        $user = $record->user;
        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // Update login metadata
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Revoke old tokens, issue fresh Sanctum token
        $user->tokens()->delete();
        $token = $user->createToken('artms-token')->plainTextToken;

        AuditLog::record('login_otp_verified', 'auth', "User {$user->email} logged in successfully with OTP.");

        return response()->json([
            'message' => 'Login successful.',
            'token'   => $token,
            'user'    => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'avatar'        => $user->avatar,
                'role'          => $user->role,
                'department_id' => $user->department_id,
                'employee_id'   => $user->employee_id,
            ],
        ]);
    }

    /**
     * POST /api/auth/resend-login-otp
     */
    public function resendLoginOtp(Request $request): JsonResponse
    {
        $request->validate([
            'verification_id' => ['required', 'string'],
        ]);

        $record = AuthenticationOtp::where('verification_id', $request->verification_id)
            ->where('purpose', 'login_verification')
            ->whereNull('used_at')
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'Invalid or expired verification session. Please log in again.',
            ], 422);
        }

        $cooldown = $record->getResendCooldownRemaining();
        if ($cooldown > 0) {
            return response()->json([
                'message'           => "Please wait {$cooldown} seconds before requesting a new code.",
                'cooldown_remaining' => $cooldown,
            ], 429);
        }

        if ($record->resend_count >= AuthenticationOtp::MAX_RESENDS) {
            return response()->json([
                'message' => 'Maximum resend limit reached. Please start a new login session.',
            ], 422);
        }

        $newOtp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $record->update([
            'otp_code'            => $newOtp,
            'otp_hash'            => Hash::make($newOtp),
            'expires_at'          => now()->addMinutes(AuthenticationOtp::EXPIRY_MINUTES),
            'attempts'            => 0,
            'resend_count'        => $record->resend_count + 1,
            'resend_available_at' => now()->addSeconds(AuthenticationOtp::RESEND_COOLDOWN_SECONDS),
        ]);

        $user = $record->user;

        try {
            Mail::send('emails.login_otp', ['otp' => $newOtp, 'user' => $user], function ($mail) use ($user) {
                $mail->to($user->email)
                     ->subject('ARTMS — Your Login Verification Code (Resent)');
            });
        } catch (\Throwable $e) {
            \Log::error("Failed to resend login OTP to {$user->email}: " . $e->getMessage());
        }

        AuditLog::record('login_otp_resend', 'auth', "Login OTP resent to {$user->email}.");

        return response()->json([
            'message'         => 'A new verification code has been sent to your email address.',
            'email_hint'      => $this->maskEmail($user->email),
            'expires_in'      => AuthenticationOtp::EXPIRY_MINUTES * 60,
            'resend_cooldown' => AuthenticationOtp::RESEND_COOLDOWN_SECONDS,
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        AuditLog::record('logout', 'auth', "User {$request->user()->email} logged out.");
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('department', 'employee');

        return response()->json(['user' => $user]);
    }

    /**
     * POST /api/auth/forgot-password
     * Sends an OTP to the user's email for password reset.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->firstOrFail();

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'otp_code'       => $otp,
            'otp_expires_at' => now()->addMinutes((int) config('auth.otp_expires_minutes', 10)),
        ]);

        // Send Password Reset OTP email
        Mail::send('emails.otp', ['otp' => $otp, 'user' => $user], function ($mail) use ($user) {
            $mail->to($user->email)
                 ->subject('ARTMS — Your Password Reset OTP');
        });

        return response()->json(['message' => 'OTP sent to your email.']);
    }

    /**
     * POST /api/auth/verify-otp (Password Reset OTP verification)
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp'   => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->firstOrFail();

        if (! $user->isOtpValid($request->otp)) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        return response()->json(['message' => 'OTP verified.']);
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->firstOrFail();

        if (! $user->isOtpValid($request->otp)) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->clearOtp();
        $user->tokens()->delete();

        AuditLog::record('password_reset', 'auth', "Password reset for {$user->email}.");

        return response()->json(['message' => 'Password reset successfully.']);
    }

    /**
     * POST /api/auth/change-password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->merge([
            'current_password'      => is_string($request->current_password) ? trim($request->current_password) : $request->current_password,
            'password'              => is_string($request->password) ? trim($request->password) : $request->password,
            'password_confirmation' => is_string($request->password_confirmation) ? trim($request->password_confirmation) : $request->password_confirmation,
        ]);

        $request->validate([
            'current_password' => ['required'],
            'password'         => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    /**
     * POST /api/auth/setup-account
     */
    public function setupAccount(Request $request): JsonResponse
    {
        $request->merge([
            'email'                 => is_string($request->email) ? trim($request->email) : $request->email,
            'token'                 => is_string($request->token) ? trim($request->token) : $request->token,
            'password'              => is_string($request->password) ? trim($request->password) : $request->password,
            'password_confirmation' => is_string($request->password_confirmation) ? trim($request->password_confirmation) : $request->password_confirmation,
        ]);

        $request->validate([
            'email'    => ['required', 'email'],
            'token'    => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $tokenRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (! $tokenRecord) {
            return response()->json(['message' => 'Invalid or expired setup token.'], 422);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        $user->update([
            'password'          => Hash::make($request->password),
            'email_verified_at' => now(),
        ]);

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        AuditLog::record('account_setup', 'auth', "Account setup completed for {$user->email}.");

        return response()->json(['message' => 'Account setup completed successfully.']);
    }

    /**
     * POST /api/me/avatar
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $path = $file->store('avatars', 'public');
            $url = url('storage/' . $path);
            $user->update(['avatar' => $url]);
        } elseif ($request->filled('avatar')) {
            $user->update(['avatar' => $request->input('avatar')]);
        } else {
            return response()->json(['message' => 'No image or image data provided.'], 422);
        }

        AuditLog::record('update_avatar', 'user', "Updated avatar for user: {$user->email}");

        return response()->json([
            'message' => 'Profile photo updated successfully.',
            'user'    => $user->fresh()->load('department', 'employee'),
        ]);
    }

    /**
     * PUT /api/me/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name'    => 'sometimes|string|max:255',
            'middle_name'   => 'nullable|string|max:255',
            'last_name'     => 'sometimes|string|max:255',
            'name'          => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:users,email,' . $user->id,
            'phone'         => 'nullable|string|max:50',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        if (isset($validated['first_name']) || isset($validated['last_name'])) {
            $fn = $validated['first_name'] ?? $user->first_name ?? '';
            $mn = $validated['middle_name'] ?? $user->middle_name ?? '';
            $ln = $validated['last_name'] ?? $user->last_name ?? '';
            $validated['name'] = trim($fn . ' ' . $mn . ' ' . $ln);
        }

        $user->update($validated);

        AuditLog::record('update_profile', 'user', "Updated profile details for user: {$user->email}");

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => $user->fresh()->load('department', 'employee'),
        ]);
    }
}
