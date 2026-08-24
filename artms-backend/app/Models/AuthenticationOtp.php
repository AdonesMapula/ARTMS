<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthenticationOtp extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'verification_id',
        'purpose',
        'otp_code',
        'otp_hash',
        'expires_at',
        'attempts',
        'resend_available_at',
        'resend_count',
        'used_at',
    ];

    protected $casts = [
        'expires_at'          => 'datetime',
        'resend_available_at' => 'datetime',
        'used_at'             => 'datetime',
        'attempts'            => 'integer',
        'resend_count'        => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a new OTP record for a user
     */
    public static function createForUser(User $user, string $purpose = 'login_verification', int $expiresMinutes = 10): self
    {
        // Invalidate any existing active OTPs for this user and purpose
        self::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        return self::create([
            'user_id'             => $user->id,
            'verification_id'     => (string) Str::uuid(),
            'purpose'             => $purpose,
            'otp_code'            => $otp,
            'otp_hash'            => hash('sha256', $otp),
            'expires_at'          => now()->addMinutes($expiresMinutes),
            'attempts'            => 0,
            'resend_available_at' => now()->addSeconds(60),
            'resend_count'        => 0,
            'used_at'             => null,
        ]);
    }

    /**
     * Check if OTP is valid
     */
    public function isValid(string $inputCode): bool
    {
        if ($this->used_at !== null) {
            return false;
        }

        if ($this->isExpired()) {
            return false;
        }

        if ($this->attempts >= 5) {
            return false;
        }

        $cleanInput = trim($inputCode);

        // Check otp_code if present, or compare sha256 hash
        if ($this->otp_code) {
            return hash_equals((string) $this->otp_code, $cleanInput);
        }

        if ($this->otp_hash) {
            return hash_equals($this->otp_hash, hash('sha256', $cleanInput));
        }

        return false;
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function canResend(): bool
    {
        return $this->resend_available_at === null || $this->resend_available_at->isPast();
    }

    public function recordFailedAttempt(): int
    {
        $this->increment('attempts');
        if ($this->attempts >= 5) {
            // Lock out / invalidate this session after 5 failed attempts
            $this->update(['used_at' => now()]);
        }
        return $this->attempts;
    }

    public function markUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
