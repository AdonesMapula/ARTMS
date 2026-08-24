<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;

class AuthenticationOtp extends Model
{
    use HasFactory;

    protected $table = 'authentication_otps';

    protected $fillable = [
        'user_id',
        'purpose',
        'verification_id',
        'otp_hash',
        'expires_at',
        'attempts',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
        'attempts'   => 'integer',
    ];

    /**
     * The user this OTP belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the OTP is currently valid (not used, not expired, not exceeded attempts).
     */
    public function isUsable(): bool
    {
        return is_null($this->used_at)
            && $this->expires_at->isFuture()
            && $this->attempts < 5;
    }

    /**
     * Verify if the provided plaintext OTP matches the stored hash.
     */
    public function verifyCode(string $plainOtp): bool
    {
        return Hash::check($plainOtp, $this->otp_hash);
    }

    /**
     * Mark this OTP session as used.
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }

    /**
     * Increment failed attempt count.
     */
    public function recordFailedAttempt(): void
    {
        $this->increment('attempts');
    }
}
