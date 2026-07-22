<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_interview_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')
                  ->unique()          // one report per interview
                  ->constrained('interviews')
                  ->cascadeOnDelete();

            // Composite soft-skill score (0–100) returned by Grok
            $table->unsignedTinyInteger('overall_score')->default(0);

            // Individual dimension scores (0–100 each)
            $table->unsignedTinyInteger('communication_score')->default(0);
            $table->unsignedTinyInteger('confidence_score')->default(0);

            // JSON arrays: [{ "point": "..." }, ...]
            $table->json('strengths');
            $table->json('weaknesses');

            // Free-text hiring recommendation from Grok
            $table->text('hiring_recommendation');

            // Raw response stored for debugging / audit trail
            $table->json('raw_ai_response');

            // Which model/version generated this report
            $table->string('model_used')->default('grok-4.5');

            // Track who generated it and when
            $table->foreignId('generated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_interview_reports');
    }
};
