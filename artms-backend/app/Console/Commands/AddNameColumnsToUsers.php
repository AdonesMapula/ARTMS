<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;

class AddNameColumnsToUsers extends Command
{
    protected $signature   = 'users:add-name-columns';
    protected $description = 'Add first_name, middle_name, last_name columns to users table if they do not exist';

    public function handle(): int
    {
        if (Schema::hasColumn('users', 'first_name')) {
            $this->info('Columns already exist — nothing to do.');
            return self::SUCCESS;
        }

        $this->info('Adding first_name, middle_name, last_name columns...');

        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->after('employee_id')->nullable();
            $table->string('middle_name')->after('first_name')->nullable();
            $table->string('last_name')->after('middle_name')->nullable();
        });

        $this->info('Backfilling existing user records from the name column...');

        $users = DB::table('users')->whereNotNull('name')->get();

        foreach ($users as $user) {
            $parts     = preg_split('/\s+/', trim($user->name));
            $firstName = $parts[0] ?? null;
            $lastName  = count($parts) > 1 ? $parts[count($parts) - 1] : null;
            $midName   = count($parts) > 2
                ? implode(' ', array_slice($parts, 1, -1))
                : null;

            DB::table('users')->where('id', $user->id)->update([
                'first_name'  => $firstName,
                'middle_name' => $midName,
                'last_name'   => $lastName,
            ]);
        }

        $this->table(
            ['ID', 'Name', 'First', 'Middle', 'Last'],
            DB::table('users')->get()->map(fn ($u) => [
                $u->id,
                $u->name,
                $u->first_name,
                $u->middle_name,
                $u->last_name,
            ])->toArray()
        );

        $this->info('Done! Columns added and backfilled successfully.');

        return self::SUCCESS;
    }
}
