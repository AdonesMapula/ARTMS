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
}
