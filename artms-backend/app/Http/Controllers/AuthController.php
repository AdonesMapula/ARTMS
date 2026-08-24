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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Determine whether the given user requires an email OTP before completing login.
     * Super Admin bypasses OTP for direct login.
     */
    protected function requiresLoginOtp(User $user): bool
    {
        return ! $user->isSuperAdmin();
    }

    /**
     * Helper to mask an email address for safe frontend presentation (e.g., j***e@domain.com)
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $username = $parts[0];
        $domain = $parts[1];

        $len = strlen($username);
        if ($len <= 2) {
            $maskedUser = substr($username, 0, 1) . '***';
        } else {
            $maskedUser = substr($username, 0, 1) . '***' . substr($username, -1);
        }

        return $maskedUser . '@' . $domain;
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

        // ── 1. SUPER ADMIN DIRECT LOGIN (NO OTP REQUIRED) ──
        if (! $this->requiresLoginOtp($user)) {
            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);

            // Revoke old tokens, issue new one
            $user->tokens()->delete();
            $token = $user->createToken('artms-token')->plainTextToken;

            AuditLog::record('login', 'auth', "Super Admin {$user->email} logged in directly.");

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

        // ── 2. NON-SUPER-ADMIN USERS (REQUIRE EMAIL OTP) ──
        // Generate secure login verification OTP session
        $authOtp = AuthenticationOtp::createForUser($user, 'login_verification', 10);

        // Send OTP email asynchronously / safely
        try {
            Mail::send('emails.login_otp', ['otp' => $authOtp->otp_code, 'user' => $user], function ($mail) use ($user) {
                $mail->to($user->email)
                     ->subject('ARTMS — Login Verification Code');
            });
        } catch (\Throwable $e) {
            \Log::error("Failed to dispatch login OTP email to {$user->email}: " . $e->getMessage());
        }

        AuditLog::record('login_otp_sent', 'auth', "Login OTP dispatched to {$user->email}");

        return response()->json([
            'requires_otp'    => true,
            'message'         => 'A 6-digit verification code has been sent to your registered email address.',
            'verification_id' => $authOtp->verification_id,
            'email_hint'      => $this->maskEmail($user->email),
            'expires_in'      => 600, // 10 minutes in seconds
            'resend_cooldown' => 60,  // 60 seconds resend cooldown
        ]);
    }

    /**
     * POST /api/auth/verify-login-otp
     * Validates 6-digit OTP and issues Sanctum token for non-super-admin users.
     */
    public function verifyLoginOtp(Request $request): JsonResponse
    {
        $request->validate([
            'verification_id' => ['required', 'string'],
            'otp'             => ['required', 'string'],
        ]);

        $authOtp = AuthenticationOtp::where('verification_id', $request->verification_id)
            ->where('purpose', 'login_verification')
            ->first();

        if (! $authOtp) {
            return response()->json(['message' => 'Invalid or expired verification session.'], 404);
        }

        if ($authOtp->used_at !== null) {
            return response()->json(['message' => 'This verification session has already been used. Please log in again.'], 422);
        }

        if ($authOtp->isExpired()) {
            return response()->json(['message' => 'Verification code has expired. Please request a new code.'], 422);
        }

        if ($authOtp->attempts >= 5) {
            return response()->json(['message' => 'Maximum verification attempts exceeded. Please restart your login.'], 429);
        }

        $inputOtp = preg_replace('/\D/', '', (string) $request->otp);

        if (! $authOtp->isValid($inputOtp)) {
            $attempts = $authOtp->recordFailedAttempt();
            $remaining = max(0, 5 - $attempts);

            AuditLog::record('login_otp_failed', 'auth', "Failed login OTP attempt for user ID {$authOtp->user_id}. Remaining: {$remaining}");

            if ($remaining === 0) {
                return response()->json(['message' => 'Maximum attempts exceeded. Verification session locked.'], 422);
            }

            return response()->json([
                'message'            => "Invalid verification code. {$remaining} attempt(s) remaining.",
                'attempts_remaining' => $remaining,
            ], 422);
        }

        // Mark OTP used
        $authOtp->markUsed();

        $user = $authOtp->user;

        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Account is inactive or not found.'], 403);
        }

        // Update login metadata
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Revoke prior tokens and issue fresh Sanctum token
        $user->tokens()->delete();
        $token = $user->createToken('artms-token')->plainTextToken;

        AuditLog::record('login', 'auth', "User {$user->email} successfully verified login OTP.");

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

        $authOtp = AuthenticationOtp::where('verification_id', $request->verification_id)
            ->where('purpose', 'login_verification')
            ->first();

        if (! $authOtp) {
            return response()->json(['message' => 'Invalid or expired verification session.'], 404);
        }

        if ($authOtp->used_at !== null) {
            return response()->json(['message' => 'This verification code has already been used. Please log in again.'], 422);
        }

        if (! $authOtp->canResend()) {
            $waitSeconds = max(1, (int) now()->diffInSeconds($authOtp->resend_available_at, false));
            return response()->json([
                'message'         => "Please wait {$waitSeconds} seconds before requesting a new code.",
                'seconds_to_wait' => $waitSeconds,
            ], 429);
        }

        if ($authOtp->resend_count >= 5) {
            return response()->json(['message' => 'Maximum resend limit reached. Please restart your login.'], 429);
        }

        $user = $authOtp->user;
        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Account is inactive or not found.'], 403);
        }

        // Invalidate the old OTP session and generate a new one
        $authOtp->update(['used_at' => now()]);
        $newOtp = AuthenticationOtp::createForUser($user, 'login_verification', 10);
        $newOtp->update(['resend_count' => $authOtp->resend_count + 1]);

        try {
            Mail::send('emails.login_otp', ['otp' => $newOtp->otp_code, 'user' => $user], function ($mail) use ($user) {
                $mail->to($user->email)
                     ->subject('ARTMS — Login Verification Code');
            });
        } catch (\Throwable $e) {
            \Log::error("Failed to resend login OTP email to {$user->email}: " . $e->getMessage());
        }

        AuditLog::record('login_otp_resend', 'auth', "Login OTP resent to {$user->email}");

        return response()->json([
            'message'         => 'A new verification code has been sent to your email.',
            'verification_id' => $newOtp->verification_id,
            'expires_in'      => 600,
            'resend_cooldown' => 60,
        ]);
    }

    /**
     * POST /api/logout
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
     * POST /api/forgot-password
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

        // Also track in authentication_otps table for auditing
        AuthenticationOtp::createForUser($user, 'password_reset', (int) config('auth.otp_expires_minutes', 10));

        // Send OTP email
        try {
            Mail::send('emails.otp', ['otp' => $otp, 'user' => $user], function ($mail) use ($user) {
                $mail->to($user->email)
                     ->subject('ARTMS — Your Password Reset OTP');
            });
        } catch (\Throwable $e) {
            \Log::error("Failed to send password reset OTP email to {$user->email}: " . $e->getMessage());
        }

        return response()->json(['message' => 'OTP sent to your email.']);
    }

    /**
     * POST /api/verify-otp
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
     * POST /api/reset-password
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
     * POST /api/change-password
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
     * POST /api/setup-account
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
