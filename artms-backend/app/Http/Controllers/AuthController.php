<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyLoginOtpRequest;
use App\Http\Requests\Auth\ResendLoginOtpRequest;
use App\Models\AuditLog;
use App\Models\AuthenticationOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Determine whether the given user requires OTP verification for login.
     * Super Admin is temporarily exempted and logs in directly with email/password.
     */
    protected function requiresLoginOtp(User $user): bool
    {
        return ! $user->hasRole('super_admin');
    }

    /**
     * Mask an email address for safe display (e.g. j***e@example.com).
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '***';
        }
        $name = $parts[0];
        $domain = $parts[1];
        $len = strlen($name);

        if ($len <= 2) {
            $maskedName = substr($name, 0, 1) . '***';
        } else {
            $maskedName = substr($name, 0, 1) . str_repeat('*', max(3, $len - 2)) . substr($name, -1);
        }

        return $maskedName . '@' . $domain;
    }

    /**
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $email = is_string($request->email) ? trim($request->email) : $request->email;
        $password = is_string($request->password) ? trim($request->password) : $request->password;

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            AuditLog::record('login_attempt_failed', 'auth', "Failed login attempt for: {$email}");
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // ── Check if user requires OTP verification ──
        if ($this->requiresLoginOtp($user)) {
            // Invalidate any previous unused login verification sessions for this user
            AuthenticationOtp::where('user_id', $user->id)
                ->where('purpose', 'login_verification')
                ->whereNull('used_at')
                ->update(['used_at' => now()]);

            // Generate cryptographically secure 6-digit OTP
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $verificationId = (string) Str::uuid();

            AuthenticationOtp::create([
                'user_id'         => $user->id,
                'purpose'         => 'login_verification',
                'verification_id' => $verificationId,
                'otp_hash'        => Hash::make($otp),
                'expires_at'      => now()->addMinutes(10),
                'attempts'        => 0,
            ]);

            // Dispatch OTP email
            try {
                Mail::send('emails.otp', [
                    'otp'     => $otp,
                    'user'    => $user,
                    'purpose' => 'login_verification',
                ], function ($mail) use ($user) {
                    $mail->to($user->email)
                         ->subject('ARTMS — Your Login Verification Code');
                });
            } catch (\Throwable $e) {
                \Log::error("Failed to send login OTP to {$user->email}: " . $e->getMessage());
            }

            AuditLog::record('login_otp_sent', 'auth', "Login verification OTP sent to {$user->email}.");

            return response()->json([
                'requires_otp'    => true,
                'message'         => 'A verification code has been sent to your registered email address.',
                'verification_id' => $verificationId,
                'email_hint'      => $this->maskEmail($user->email),
                'expires_in'      => 600,
            ]);
        }

        // ── Direct Login for Super Admin (Exempted) ──
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        $user->tokens()->delete();
        $token = $user->createToken('artms-token')->plainTextToken;

        AuditLog::record('login', 'auth', "Super Admin {$user->email} logged in directly.");

        return response()->json([
            'requires_otp' => false,
            'message'      => 'Login successful.',
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

    /**
     * POST /api/auth/verify-login-otp
     */
    public function verifyLoginOtp(VerifyLoginOtpRequest $request): JsonResponse
    {
        $verificationId = $request->verification_id;
        $otpCode = $request->otp;

        $otpRecord = AuthenticationOtp::where('verification_id', $verificationId)
            ->where('purpose', 'login_verification')
            ->whereNull('used_at')
            ->first();

        if (! $otpRecord) {
            return response()->json(['message' => 'Invalid or expired verification session. Please log in again.'], 422);
        }

        if ($otpRecord->expires_at->isPast()) {
            $otpRecord->markAsUsed();
            AuditLog::record('login_otp_expired', 'auth', "Expired login OTP attempt for user ID #{$otpRecord->user_id}.");
            return response()->json(['message' => 'Verification code has expired. Please request a new code.'], 422);
        }

        if ($otpRecord->attempts >= 5) {
            $otpRecord->markAsUsed();
            AuditLog::record('login_otp_failed', 'auth', "Maximum login OTP attempts exceeded for user ID #{$otpRecord->user_id}.");
            return response()->json(['message' => 'Maximum verification attempts exceeded. Please start login again.'], 422);
        }

        // Verify the code
        if (! $otpRecord->verifyCode($otpCode)) {
            $otpRecord->recordFailedAttempt();
            $remaining = 5 - $otpRecord->attempts;
            AuditLog::record('login_otp_failed', 'auth', "Invalid login OTP entered for user ID #{$otpRecord->user_id}.");

            if ($remaining <= 0) {
                $otpRecord->markAsUsed();
                return response()->json(['message' => 'Too many incorrect attempts. Please start login again.'], 422);
            }

            return response()->json([
                'message'             => "Invalid verification code. You have {$remaining} attempt(s) remaining.",
                'attempts_remaining'  => $remaining,
            ], 422);
        }

        // Code is valid — Mark OTP as used
        $otpRecord->markAsUsed();

        $user = $otpRecord->user;
        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Your account is inactive.'], 403);
        }

        // Update login metadata
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Revoke old tokens, issue new one
        $user->tokens()->delete();
        $token = $user->createToken('artms-token')->plainTextToken;

        AuditLog::record('login_success', 'auth', "User {$user->email} verified login OTP successfully.");

        return response()->json([
            'message' => 'Login verification successful.',
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
    public function resendLoginOtp(ResendLoginOtpRequest $request): JsonResponse
    {
        $verificationId = $request->verification_id;

        $otpRecord = AuthenticationOtp::where('verification_id', $verificationId)
            ->where('purpose', 'login_verification')
            ->whereNull('used_at')
            ->first();

        if (! $otpRecord) {
            return response()->json(['message' => 'Invalid or expired verification session. Please log in again.'], 422);
        }

        // 60-second cooldown check
        if ($otpRecord->updated_at && $otpRecord->updated_at->gt(now()->subSeconds(60))) {
            $secondsRemaining = 60 - now()->diffInSeconds($otpRecord->updated_at);
            return response()->json([
                'message'           => "Please wait {$secondsRemaining} seconds before requesting a new code.",
                'seconds_remaining' => $secondsRemaining,
            ], 429);
        }

        $user = $otpRecord->user;
        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Your account is inactive.'], 403);
        }

        // Generate new 6-digit OTP
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $otpRecord->update([
            'otp_hash'   => Hash::make($otp),
            'expires_at' => now()->addMinutes(10),
            'attempts'   => 0,
            'updated_at' => now(),
        ]);

        // Dispatch OTP email
        try {
            Mail::send('emails.otp', [
                'otp'     => $otp,
                'user'    => $user,
                'purpose' => 'login_verification',
            ], function ($mail) use ($user) {
                $mail->to($user->email)
                     ->subject('ARTMS — Your New Login Verification Code');
            });
        } catch (\Throwable $e) {
            \Log::error("Failed to resend login OTP to {$user->email}: " . $e->getMessage());
        }

        AuditLog::record('login_otp_resend', 'auth', "Resent login OTP to {$user->email}.");

        return response()->json([
            'message'    => 'A new verification code has been sent to your email.',
            'email_hint' => $this->maskEmail($user->email),
            'expires_in' => 600,
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            AuditLog::record('logout', 'auth', "User {$request->user()->email} logged out.");
            $request->user()->currentAccessToken()?->delete();
        }

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
     * Sends an OTP to the user's email.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->firstOrFail();

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'otp_code'       => $otp,
            'otp_expires_at' => now()->addMinutes((int) config('auth.otp_expires_minutes', 10)),
        ]);

        // Send OTP email
        Mail::send('emails.otp', [
            'otp'     => $otp,
            'user'    => $user,
            'purpose' => 'password_reset',
        ], function ($mail) use ($user) {
            $mail->to($user->email)
                 ->subject('ARTMS — Your Password Reset OTP');
        });

        AuditLog::record('forgot_password_otp', 'auth', "Password reset OTP sent to {$user->email}.");

        return response()->json(['message' => 'OTP sent to your email.']);
    }

    /**
     * POST /api/auth/verify-otp
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

        AuditLog::record('password_reset', 'auth', "Password reset completed for {$user->email}.");

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
            'password' => Hash::make($request->password),
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
