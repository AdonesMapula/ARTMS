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
        if (Schema::hasTable('interview_transcripts')) {
            Schema::table('interview_transcripts', function (Blueprint $table) {
                if (! Schema::hasColumn('interview_transcripts', 'dialect_detected')) {
                    $table->string('dialect_detected', 50)->nullable()->after('text');
                }
                if (! Schema::hasColumn('interview_transcripts', 'translated_text')) {
                    $table->text('translated_text')->nullable()->after('dialect_detected');
                }
            });
        }

        if (Schema::hasTable('interview_behavioral_metrics')) {
            Schema::table('interview_behavioral_metrics', function (Blueprint $table) {
                if (! Schema::hasColumn('interview_behavioral_metrics', 'affect_metrics')) {
                    $table->json('affect_metrics')->nullable()->after('speech_metrics');
                }
            });
        }

        if (Schema::hasTable('ai_interview_reports')) {
            Schema::table('ai_interview_reports', function (Blueprint $table) {
                if (! Schema::hasColumn('ai_interview_reports', 'dialect_summary')) {
                    $table->json('dialect_summary')->nullable()->after('weaknesses');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('interview_transcripts')) {
            Schema::table('interview_transcripts', function (Blueprint $table) {
                if (Schema::hasColumn('interview_transcripts', 'translated_text')) {
                    $table->dropColumn('translated_text');
                }
                if (Schema::hasColumn('interview_transcripts', 'dialect_detected')) {
                    $table->dropColumn('dialect_detected');
                }
            });
        }

        if (Schema::hasTable('interview_behavioral_metrics')) {
            Schema::table('interview_behavioral_metrics', function (Blueprint $table) {
                if (Schema::hasColumn('interview_behavioral_metrics', 'affect_metrics')) {
                    $table->dropColumn('affect_metrics');
                }
            });
        }

        if (Schema::hasTable('ai_interview_reports')) {
            Schema::table('ai_interview_reports', function (Blueprint $table) {
                if (Schema::hasColumn('ai_interview_reports', 'dialect_summary')) {
                    $table->dropColumn('dialect_summary');
                }
            });
        }
    }
};
