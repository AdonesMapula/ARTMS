<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('applicants')->cascadeOnDelete();
            $table->decimal('ai_score', 5, 2)->nullable();        // overall AI score 0-100
            $table->decimal('confidence_level', 5, 2)->nullable(); // 0-100
            $table->enum('fit_label', ['high', 'medium', 'low'])->nullable();
            $table->decimal('qualification_match', 5, 2)->nullable(); // % match
            $table->json('skills_matched')->nullable();
            $table->json('skills_missing')->nullable();
            $table->json('score_breakdown')->nullable(); // structured JSON
            $table->text('ai_summary')->nullable();
            $table->text('ai_feedback')->nullable();     // sent to applicant
            $table->text('hr_interpretation')->nullable();
            $table->enum('hr_decision', ['qualified', 'not_qualified', 'pending'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_evaluations');
    }
};
