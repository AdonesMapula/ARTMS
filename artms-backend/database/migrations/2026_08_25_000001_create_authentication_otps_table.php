<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('authentication_otps')) {
            Schema::create('authentication_otps', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('verification_id', 64)->unique()->index();
                $table->string('purpose', 32)->default('login_verification')->index();
                $table->string('otp_code', 6);
                $table->string('otp_hash')->nullable();
                $table->timestamp('expires_at')->index();
                $table->unsignedTinyInteger('attempts')->default(0);
                $table->unsignedTinyInteger('resend_count')->default(0);
                $table->timestamp('resend_available_at')->nullable();
                $table->timestamp('last_resend_at')->nullable();
                $table->timestamp('used_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'purpose', 'used_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('authentication_otps');
    }
};
