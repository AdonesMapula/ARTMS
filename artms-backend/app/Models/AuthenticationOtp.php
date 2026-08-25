<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthenticationOtp extends Model
{
    use HasFactory;

    protected $table = 'authentication_otps';

    protected $fillable = [
        'user_id',
        'verification_id',
        'purpose',
        'otp_code',
        'otp_hash',
        'expires_at',
        'attempts',
        'resend_count',
        'resend_available_at',
        'used_at',
    ];

    protected $hidden = [
        'otp_code',
        'otp_hash',
    ];

    protected $casts = [
        'expires_at'          => 'datetime',
        'resend_available_at' => 'datetime',
        'used_at'             => 'datetime',
        'attempts'            => 'integer',
        'resend_count'        => 'integer',
    ];

    public const MAX_ATTEMPTS = 5;
    public const MAX_RESENDS = 5;
    public const RESEND_COOLDOWN_SECONDS = 60;
    public const EXPIRY_MINUTES = 10;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a new login verification OTP for the user.
     */
    public static function createLoginOtp(User $user): array
    {
        // Invalidate any previous active login verification OTPs for this user
        static::where('user_id', $user->id)
            ->where('purpose', 'login_verification')
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $verificationId = (string) Str::random(64);

        $record = static::create([
            'user_id'             => $user->id,
            'verification_id'     => $verificationId,
            'purpose'             => 'login_verification',
            'otp_code'            => $otp,
            'otp_hash'            => Hash::make($otp),
            'expires_at'          => now()->addMinutes(self::EXPIRY_MINUTES),
            'attempts'            => 0,
            'resend_count'        => 0,
            'resend_available_at' => now()->addSeconds(self::RESEND_COOLDOWN_SECONDS),
        ]);

        return [
            'record'          => $record,
            'otp'             => $otp,
            'verification_id' => $verificationId,
        ];
    }

    /**
     * Check if the OTP matches and is valid.
     */
    public function isValid(string $inputOtp): bool
    {
        if ($this->isUsed() || $this->isExpired() || $this->hasExceededAttempts()) {
            return false;
        }

        $input = trim($inputOtp);

        if ($this->otp_hash && Hash::check($input, $this->otp_hash)) {
            return true;
        }

        return hash_equals((string) $this->otp_code, $input);
    }

    public function isUsed(): bool
    {
        return ! is_null($this->used_at);
    }

    public function isExpired(): bool
    {
        return $this->expires_at ? $this->expires_at->isPast() : true;
    }

    public function hasExceededAttempts(): bool
    {
        return $this->attempts >= self::MAX_ATTEMPTS;
    }

    public function canResend(): bool
    {
        if ($this->isUsed() || $this->resend_count >= self::MAX_RESENDS) {
            return false;
        }

        return $this->getResendCooldownRemaining() <= 0;
    }

    public function getResendCooldownRemaining(): int
    {
        if (! $this->resend_available_at) {
            return 0;
        }

        if ($this->resend_available_at->isPast()) {
            return 0;
        }

        return (int) max(0, now()->diffInSeconds($this->resend_available_at, false));
    }
}
