<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('authentication_otps', function (Blueprint $table) {
            if (! Schema::hasColumn('authentication_otps', 'otp_code')) {
                $table->string('otp_code', 10)->nullable()->after('purpose');
            }
            if (! Schema::hasColumn('authentication_otps', 'resend_available_at')) {
                $table->timestamp('resend_available_at')->nullable()->after('attempts');
            }
            if (! Schema::hasColumn('authentication_otps', 'resend_count')) {
                $table->unsignedTinyInteger('resend_count')->default(0)->after('resend_available_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('authentication_otps', function (Blueprint $table) {
            $table->dropColumn(['otp_code', 'resend_available_at', 'resend_count']);
        });
    }
};
