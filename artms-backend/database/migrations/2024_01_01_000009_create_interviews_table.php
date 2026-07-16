<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_id')->constrained('applicants')->cascadeOnDelete();
            $table->foreignId('job_posting_id')->constrained('job_postings')->restrictOnDelete();
            $table->enum('interview_stage', ['interview_1', 'interview_2', 'final'])->default('interview_1');
            $table->datetime('scheduled_at');
            $table->string('location')->nullable();
            $table->string('meeting_link')->nullable();
            $table->enum('interview_type', ['in_person', 'online', 'phone'])->default('in_person');
            $table->enum('status', ['scheduled', 'confirmed', 'done', 'cancelled', 'no_show'])
                  ->default('scheduled');
            $table->boolean('applicant_confirmed')->default(false);
            $table->timestamp('applicant_confirmed_at')->nullable();
            $table->foreignId('interviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('rating_score', 5, 2)->nullable();
            $table->text('evaluation_notes')->nullable();
            $table->json('rubric_scores')->nullable(); // structured rubric scores
            $table->text('ai_summary')->nullable();
            $table->text('ai_recommendation')->nullable();
            $table->enum('hr_decision', ['pass', 'fail', 'pending'])->default('pending');
            $table->boolean('invitation_sent')->default(false);
            $table->boolean('reminder_sent')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
