<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_recordings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')
                  ->constrained('interviews')
                  ->cascadeOnDelete();

            $table->string('egress_id')->unique();
            $table->string('participant_identity')->nullable();
            $table->enum('participant_role', ['hr', 'applicant', 'room_composite', 'system'])->default('system');
            $table->string('file_path')->nullable();
            $table->string('file_url')->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->enum('status', ['active', 'completed', 'failed'])->default('active');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['interview_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_recordings');
    }
};
