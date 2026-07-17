<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('manpower_requests', function (Blueprint $table) {
            $table->unsignedTinyInteger('fit_threshold_high')->default(75)->after('approval_remarks');
            $table->unsignedTinyInteger('fit_threshold_medium')->default(50)->after('fit_threshold_high');
        });
    }

    public function down(): void
    {
        Schema::table('manpower_requests', function (Blueprint $table) {
            $table->dropColumn(['fit_threshold_high', 'fit_threshold_medium']);
        });
    }
};
