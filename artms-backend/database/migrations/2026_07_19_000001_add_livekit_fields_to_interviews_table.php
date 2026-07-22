<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            // LiveKit room identifier (unique per interview session)
            $table->string('livekit_room_name')->nullable()->after('meeting_link');

            // Extend status to include video session states
            // We modify the existing enum to add 'active' alongside existing values.
            // Note: MySQL requires a full redefinition to change an enum.
            \DB::statement("ALTER TABLE interviews MODIFY COLUMN status ENUM(
                'scheduled','confirmed','active','done','cancelled','no_show'
            ) NOT NULL DEFAULT 'scheduled'");
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->dropColumn('livekit_room_name');

            \DB::statement("ALTER TABLE interviews MODIFY COLUMN status ENUM(
                'scheduled','confirmed','done','cancelled','no_show'
            ) NOT NULL DEFAULT 'scheduled'");
        });
    }
};
