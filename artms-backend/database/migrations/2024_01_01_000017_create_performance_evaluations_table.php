<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('evaluated_by')->constrained('users')->restrictOnDelete();
            $table->string('evaluation_period'); // e.g., "Q1 2024", "2024-01"
            $table->decimal('score', 5, 2)->nullable();
            $table->enum('rating', ['excellent', 'very_good', 'good', 'needs_improvement', 'unsatisfactory'])
                  ->nullable();
            $table->json('criteria_scores')->nullable();
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('promotion_recommended')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_evaluations');
    }
};
