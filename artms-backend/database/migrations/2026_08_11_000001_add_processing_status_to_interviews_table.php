<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->enum('recording_status', ['pending', 'recording', 'finalizing', 'completed', 'failed'])->default('pending')->after('status');
            $table->enum('transcription_status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->after('recording_status');
            $table->enum('analysis_status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->after('transcription_status');
            $table->enum('report_status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->after('analysis_status');
            $table->string('audio_recording_path')->nullable()->after('report_status');
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->dropColumn([
                'recording_status',
                'transcription_status',
                'analysis_status',
                'report_status',
                'audio_recording_path',
            ]);
        });
    }
};
