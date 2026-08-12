<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_behavioral_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')
                  ->unique()
                  ->constrained('interviews')
                  ->cascadeOnDelete();

            $table->json('aggregated_metrics')->nullable();
            $table->json('speech_metrics')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_behavioral_metrics');
    }
};
