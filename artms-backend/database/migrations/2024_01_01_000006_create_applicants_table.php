<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->string('application_id')->unique(); // e.g., APP-2024-00001
            $table->foreignId('job_posting_id')->constrained('job_postings')->restrictOnDelete();

            // Personal Info
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('email')->index();
            $table->string('phone')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();
            $table->string('gender')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('nationality')->nullable();

            // Application
            $table->string('resume_path')->nullable();
            $table->string('resume_original_name')->nullable();
            $table->boolean('informed_consent')->default(false);

            // Status tracking
            $table->enum('status', [
                'applied',
                'ai_screening',
                'screening_passed',
                'screening_failed',
                'interview_1_scheduled',
                'interview_1_done',
                'interview_2_scheduled',
                'interview_2_done',
                'for_hiring',
                'hired',
                'rejected',
                'withdrawn'
            ])->default('applied');

            $table->boolean('is_shortlisted')->default(false);
            $table->decimal('overall_score', 5, 2)->nullable();
            $table->integer('ranking')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicants');
    }
};
