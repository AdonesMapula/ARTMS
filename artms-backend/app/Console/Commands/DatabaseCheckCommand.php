<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseCheckCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'artms:db-health';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform a safe database connection and health check';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        try {
            $connection = DB::connection();
            $connection->getPdo();
            
            $dbName = $connection->getDatabaseName();
            $driver = $connection->getDriverName();
            
            // Get database server version safely
            $serverVersion = 'Unknown';
            try {
                $results = DB::select("SELECT VERSION() as version");
                if (!empty($results)) {
                    $serverVersion = $results[0]->version;
                }
            } catch (\Exception $e) {
                // Ignore version check query failures
            }

            // Safe migration status check
            $migrator = app('migrator');
            $files = $migrator->getMigrationFiles($migrator->paths());
            $ran = $migrator->getRepository()->getRan();
            $pending = count($files) - count($ran);

            $migrationStatus = ($pending > 0) ? "Pending ({$pending} new migrations)" : "Up to date";

            // Verify if key tables exist (e.g., users, employees, departments)
            $requiredTables = ['users', 'employees', 'departments', 'job_postings', 'applicants', 'interviews'];
            $missingTables = [];
            foreach ($requiredTables as $table) {
                if (!Schema::hasTable($table)) {
                    $missingTables[] = $table;
                }
            }
            $tablesStatus = empty($missingTables) ? "OK" : "Missing (" . implode(', ', $missingTables) . ")";

            // Verify performance indexes exist
            $performanceIndexes = ['idx_users_dept_active_role', 'idx_job_postings_status_active_created', 'idx_applicants_posting_status'];
            $missingIndexes = [];
            foreach ($performanceIndexes as $index) {
                try {
                    $indexes = [];
                    if ($index === 'idx_users_dept_active_role') {
                        $indexes = DB::select("SHOW INDEX FROM users WHERE Key_name = 'idx_users_dept_active_role'");
                    } elseif ($index === 'idx_job_postings_status_active_created') {
                        $indexes = DB::select("SHOW INDEX FROM job_postings WHERE Key_name = 'idx_job_postings_status_active_created'");
                    } elseif ($index === 'idx_applicants_posting_status') {
                        $indexes = DB::select("SHOW INDEX FROM applicants WHERE Key_name = 'idx_applicants_posting_status'");
                    }
                    if (empty($indexes)) {
                        $missingIndexes[] = $index;
                    }
                } catch (\Exception $e) {
                    $missingIndexes[] = $index;
                }
            }
            $indexesStatus = empty($missingIndexes) ? "OK" : "Missing (" . implode(', ', $missingIndexes) . ")";

            $this->line("ARTMS Database Health Check");
            $this->line("---------------------------");
            $this->line("Driver: <comment>{$driver}</comment>");
            $this->line("Connection: <info>OK</info>");
            $this->line("Database: <comment>{$dbName}</comment>");
            $this->line("MySQL Version: <comment>{$serverVersion}</comment>");
            $this->line("Migrations: <comment>{$migrationStatus}</comment>");
            $this->line("Tables: <comment>{$tablesStatus}</comment>");
            $this->line("Indexes: <comment>{$indexesStatus}</comment>");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Database Connection failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
