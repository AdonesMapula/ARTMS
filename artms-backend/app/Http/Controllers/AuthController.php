<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\AuditLog;
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
     * POST /api/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // Update last login info
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Revoke old tokens, issue new one
        $user->tokens()->delete();
        $token = $user->createToken('artms-token')->plainTextToken;

        AuditLog::record('login', 'auth', "User {$user->email} logged in.");

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
     * Sends an OTP to the user's email.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->firstOrFail();

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'otp_code'       => $otp,
            'otp_expires_at' => now()->addMinutes((int) config('auth.otp_expires_minutes', 10)),
        ]);

        // Send OTP email
        Mail::send('emails.otp', ['otp' => $otp, 'user' => $user], function ($mail) use ($user) {
            $mail->to($user->email)
                 ->subject('ARTMS — Your Password Reset OTP');
        });

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
