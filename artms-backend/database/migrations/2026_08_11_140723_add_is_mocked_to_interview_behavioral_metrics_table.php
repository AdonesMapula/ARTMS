<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('interview_behavioral_metrics', function (Blueprint $table) {
            $table->boolean('is_mocked')->default(false)->after('speech_metrics');
        });

        // Flag historical mock rows using a fixed cutoff timestamp
        \Illuminate\Support\Facades\DB::table('interview_behavioral_metrics')
            ->where('created_at', '<', '2026-08-11 22:00:00')
            ->update(['is_mocked' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('interview_behavioral_metrics', function (Blueprint $table) {
            $table->dropColumn('is_mocked');
        });
    }
};
