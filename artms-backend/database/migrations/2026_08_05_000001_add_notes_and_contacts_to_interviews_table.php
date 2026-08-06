<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            if (!Schema::hasColumn('interviews', 'notes')) {
                $table->text('notes')->nullable()->after('meeting_link');
            }
            if (!Schema::hasColumn('interviews', 'contact_email')) {
                $table->string('contact_email')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('interviews', 'contact_number')) {
                $table->string('contact_number')->nullable()->after('contact_email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->dropColumn(['notes', 'contact_email', 'contact_number']);
        });
    }
};
