<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates permissions table with boolean columns for each role.
     * This eliminates the need for pivot tables and makes queries simpler.
     */
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique()->comment('Permission key (e.g., view_users)');
            $table->string('display_name', 150)->comment('Human-readable name');
            $table->text('description')->nullable()->comment('What this permission allows');
            $table->string('resource', 50)->index()->comment('Resource category (users, roles, etc)');
            
            // Boolean columns for each role
            $table->boolean('super_admin')->default(true)->comment('Super Admin always has all permissions');
            $table->boolean('hr_admin')->default(false)->comment('HR Admin permission flag');
            $table->boolean('coo')->default(false)->comment('COO permission flag');
            $table->boolean('department_head')->default(false)->comment('Department Head permission flag');
            $table->boolean('employee')->default(false)->comment('Employee permission flag');
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('name');
            $table->index(['resource', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
