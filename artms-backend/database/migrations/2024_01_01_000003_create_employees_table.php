<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('department_id')->constrained('departments')->restrictOnDelete();
            $table->string('position');
            $table->enum('employment_status', ['active', 'resigned', 'terminated', 'on_leave'])
                  ->default('active');
            $table->date('date_hired');
            $table->decimal('salary', 12, 2)->default(0);
            $table->string('employment_type')->default('regular'); // regular, contractual, probationary
            $table->text('address')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_number')->nullable();
            $table->date('date_terminated')->nullable();
            $table->text('termination_reason')->nullable();
            $table->boolean('clearance_processed')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
