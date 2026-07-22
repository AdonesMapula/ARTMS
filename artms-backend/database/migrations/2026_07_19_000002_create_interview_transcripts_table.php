<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_transcripts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_id')
                  ->constrained('interviews')
                  ->cascadeOnDelete();

            // Identity of the speaker in the LiveKit room
            $table->string('speaker_identity'); // e.g. "hr_3" or "applicant_7"

            // Human-readable role label derived from the identity prefix
            $table->enum('speaker_role', ['hr', 'applicant', 'system'])->default('system');

            // Transcribed text segment
            $table->text('text');

            // Offset in seconds from the start of the interview (for ordering)
            $table->unsignedInteger('segment_offset')->default(0);

            // Wall-clock time the segment was received
            $table->timestamp('spoken_at')->useCurrent();

            $table->timestamps();

            // Fast lookup for a given interview ordered by time
            $table->index(['interview_id', 'spoken_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_transcripts');
    }
};
