<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            DB::statement("ALTER TABLE interviews MODIFY COLUMN interview_stage VARCHAR(100) NOT NULL DEFAULT 'initial_screening'");
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            DB::statement("ALTER TABLE interviews MODIFY COLUMN interview_stage ENUM('interview_1', 'interview_2', 'final') NOT NULL DEFAULT 'interview_1'");
        });
    }
};
