<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseController extends Controller
{
    /**
     * Map tables to logical system categories
     */
    protected array $categories = [
        'core_system' => [
            'users',
            'departments',
            'permissions',
            'custom_roles',
            'role_permissions',
            'personal_access_tokens',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'failed_jobs',
            'jobs',
            'job_batches',
            'migrations',
        ],
        'recruitment' => [
            'job_library',
            'job_postings',
            'manpower_requests',
            'applicants',
            'interviews',
            'ai_evaluations',
            'interview_reports',
            'application_histories',
            'job_categories',
        ],
        'workforce' => [
            'employees',
            'attendances',
            'leaves',
            'leave_balances',
            'payrolls',
        ],
        'communications' => [
            'messages',
            'conversations',
            'notifications',
        ],
        'audit_logs' => [
            'audit_logs',
        ],
    ];

    /**
     * Presets for one-click purges
     */
    protected array $presetTables = [
        'recruitment' => [
            'applicants',
            'ai_evaluations',
            'interviews',
            'interview_reports',
            'job_postings',
            'job_library',
            'manpower_requests',
        ],
        'workforce' => [
            'attendances',
            'leaves',
            'leave_balances',
            'payrolls',
            'employees',
        ],
        'communications' => [
            'messages',
            'conversations',
            'notifications',
        ],
        'logs' => [
            'audit_logs',
            'failed_jobs',
        ],
        'all_except_system' => [
            // Target all data tables except core authentication, departments, and roles
            'applicants',
            'ai_evaluations',
            'interviews',
            'interview_reports',
            'job_postings',
            'job_library',
            'manpower_requests',
            'attendances',
            'leaves',
            'leave_balances',
            'payrolls',
            'employees',
            'messages',
            'conversations',
            'notifications',
            'audit_logs',
        ],
    ];

    /**
     * GET /api/developer/database/tables
     * Return all database tables with real-time statistics
     */
    public function tables(): JsonResponse
    {
        $driver = DB::getDriverName();
        $dbName = DB::getDatabaseName();
        $tablesList = [];
        $totalRows = 0;
        $totalSizeBytes = 0;

        if ($driver === 'mysql') {
            $rawTables = DB::select("
                SELECT 
                    TABLE_NAME AS table_name,
                    ENGINE AS engine,
                    TABLE_ROWS AS table_rows,
                    DATA_LENGTH AS data_length,
                    INDEX_LENGTH AS index_length,
                    (DATA_LENGTH + INDEX_LENGTH) AS total_length,
                    CREATE_TIME AS create_time,
                    UPDATE_TIME AS update_time
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = ?
                ORDER BY TABLE_NAME ASC
            ", [$dbName]);

            foreach ($rawTables as $t) {
                $tName = $t->table_name;
                // For exact accuracy, query actual COUNT(*)
                try {
                    $exactCount = DB::table($tName)->count();
                } catch (\Throwable) {
                    $exactCount = (int) $t->table_rows;
                }

                $sizeBytes = (int) $t->total_length;
                $totalRows += $exactCount;
                $totalSizeBytes += $sizeBytes;

                $category = $this->classifyTable($tName);

                $tablesList[] = [
                    'name'        => $tName,
                    'category'    => $category,
                    'rows'        => $exactCount,
                    'data_bytes'  => (int) $t->data_length,
                    'index_bytes' => (int) $t->index_length,
                    'total_bytes' => $sizeBytes,
                    'size_human'  => $this->formatBytes($sizeBytes),
                    'engine'      => $t->engine ?? 'InnoDB',
                    'updated_at'  => $t->update_time ?? $t->create_time,
                ];
            }
        } else {
            // Fallback for PostgreSQL / SQLite
            $allTables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
            foreach ($allTables as $row) {
                $tName = $row->table_name ?? $row->TABLE_NAME;
                $count = DB::table($tName)->count();
                $totalRows += $count;
                $tablesList[] = [
                    'name'       => $tName,
                    'category'   => $this->classifyTable($tName),
                    'rows'       => $count,
                    'total_bytes'=> 0,
                    'size_human' => '—',
                    'engine'     => $driver,
                    'updated_at' => null,
                ];
            }
        }

        return response()->json([
            'database'       => $dbName,
            'driver'         => $driver,
            'total_tables'   => count($tablesList),
            'total_rows'     => $totalRows,
            'total_size_bytes' => $totalSizeBytes,
            'total_size_human' => $this->formatBytes($totalSizeBytes),
            'tables'         => $tablesList,
            'presets'        => array_keys($this->presetTables),
        ]);
    }

    /**
     * POST /api/developer/database/truncate
     * Truncate a single specified table
     */
    public function truncate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_name' => ['required', 'string'],
        ]);

        $tableName = $validated['table_name'];
        $dbName = DB::getDatabaseName();

        if ($tableName === 'migrations') {
            return response()->json(['message' => 'The migrations table cannot be truncated for system stability.'], 422);
        }

        if (!Schema::hasTable($tableName)) {
            return response()->json(['message' => "Table '{$tableName}' does not exist."], 404);
        }

        $oldCount = DB::table($tableName)->count();

        Schema::disableForeignKeyConstraints();
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("TRUNCATE TABLE \"{$tableName}\" RESTART IDENTITY CASCADE;");
        } else {
            DB::statement("TRUNCATE TABLE `{$tableName}`;");
        }
        Schema::enableForeignKeyConstraints();

        Cache::flush();

        try {
            AuditLog::record(
                'database_truncate',
                'database',
                "Developer truncated table: {$tableName} (deleted {$oldCount} records)",
                ['table' => $tableName, 'records_deleted' => $oldCount]
            );
        } catch (\Throwable) {}

        return response()->json([
            'message'         => "Table '{$tableName}' truncated successfully. Auto-increment reset.",
            'table_name'      => $tableName,
            'records_deleted' => $oldCount,
            'current_rows'    => 0,
        ]);
    }

    /**
     * POST /api/developer/database/purge-except
     * Truncate all tables EXCEPT the specified excluded list
     */
    public function purgeExcept(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'excluded_tables' => ['array'],
            'excluded_tables.*' => ['string'],
        ]);

        $excluded = array_map('strtolower', $validated['excluded_tables'] ?? []);
        // Always safeguard migrations
        if (!in_array('migrations', $excluded, true)) {
            $excluded[] = 'migrations';
        }

        $allTables = $this->getAllTableNames();
        $targetTables = array_filter($allTables, fn ($t) => !in_array(strtolower($t), $excluded, true));

        $deletedSummary = [];
        $totalDeleted = 0;

        Schema::disableForeignKeyConstraints();

        foreach ($targetTables as $table) {
            try {
                $count = DB::table($table)->count();
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE;");
                } else {
                    DB::statement("TRUNCATE TABLE `{$table}`;");
                }
                $deletedSummary[$table] = $count;
                $totalDeleted += $count;
            } catch (\Throwable $e) {
                \Log::error("Failed truncating {$table}: " . $e->getMessage());
            }
        }

        Schema::enableForeignKeyConstraints();
        Cache::flush();

        try {
            AuditLog::record(
                'database_purge_except',
                'database',
                "Database purged with exclusions. Truncated " . count($deletedSummary) . " tables ({$totalDeleted} total records). Kept: " . implode(', ', $excluded),
                [
                    'truncated_tables' => array_keys($deletedSummary),
                    'kept_tables'      => $excluded,
                    'total_deleted'    => $totalDeleted,
                ]
            );
        } catch (\Throwable) {}

        return response()->json([
            'message'          => "Database purged successfully. " . count($deletedSummary) . " tables cleared ({$totalDeleted} records removed).",
            'truncated_tables' => array_keys($deletedSummary),
            'kept_tables'      => $excluded,
            'total_deleted'    => $totalDeleted,
            'breakdown'        => $deletedSummary,
        ]);
    }

    /**
     * POST /api/developer/database/purge-preset
     * One-click categorized preset purges
     */
    public function purgePreset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preset' => ['required', 'string'],
        ]);

        $preset = $validated['preset'];

        if (!isset($this->presetTables[$preset])) {
            return response()->json(['message' => "Invalid purge preset '{$preset}'."], 422);
        }

        $tablesToPurge = $this->presetTables[$preset];
        $deletedSummary = [];
        $totalDeleted = 0;

        Schema::disableForeignKeyConstraints();

        foreach ($tablesToPurge as $table) {
            if (Schema::hasTable($table)) {
                try {
                    $count = DB::table($table)->count();
                    if (DB::getDriverName() === 'pgsql') {
                        DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE;");
                    } else {
                        DB::statement("TRUNCATE TABLE `{$table}`;");
                    }
                    $deletedSummary[$table] = $count;
                    $totalDeleted += $count;
                } catch (\Throwable $e) {
                    \Log::error("Preset purge failed for table {$table}: " . $e->getMessage());
                }
            }
        }

        Schema::enableForeignKeyConstraints();
        Cache::flush();

        try {
            AuditLog::record(
                'database_purge_preset',
                'database',
                "Executed preset purge [{$preset}]: Cleared " . count($deletedSummary) . " tables ({$totalDeleted} records).",
                ['preset' => $preset, 'tables' => array_keys($deletedSummary), 'deleted_records' => $totalDeleted]
            );
        } catch (\Throwable) {}

        return response()->json([
            'message'         => "Preset '{$preset}' executed successfully. Cleared " . count($deletedSummary) . " tables ({$totalDeleted} records).",
            'preset'          => $preset,
            'cleared_tables'  => array_keys($deletedSummary),
            'records_deleted' => $totalDeleted,
            'breakdown'       => $deletedSummary,
        ]);
    }

    /**
     * POST /api/developer/database/reseed
     * Trigger specific seeders on-demand
     */
    public function reseed(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seeder' => ['required', 'string'],
        ]);

        $allowedSeeders = [
            'JobPostingSeeder'      => \Database\Seeders\JobPostingSeeder::class,
            'ApplicantSeeder'       => \Database\Seeders\ApplicantSeeder::class,
            'EmployeeSeeder'        => \Database\Seeders\EmployeeSeeder::class,
            'InterviewSeeder'       => \Database\Seeders\InterviewSeeder::class,
            'ManpowerRequestSeeder' => \Database\Seeders\ManpowerRequestSeeder::class,
            'DatabaseSeeder'        => \Database\Seeders\DatabaseSeeder::class,
        ];

        $seederName = $validated['seeder'];

        if (!isset($allowedSeeders[$seederName])) {
            return response()->json(['message' => "Seeder '{$seederName}' is not allowed or does not exist."], 422);
        }

        try {
            $exitCode = Artisan::call('db:seed', [
                '--class' => $allowedSeeders[$seederName],
                '--force' => true,
            ]);

            $output = Artisan::output();
            Cache::flush();

            try {
                AuditLog::record(
                    'database_reseed',
                    'database',
                    "Developer executed seeder: {$seederName}",
                    ['seeder' => $seederName]
                );
            } catch (\Throwable) {}

            return response()->json([
                'message' => "Seeder '{$seederName}' executed successfully.",
                'output'  => $output,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => "Seeder failed: " . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/developer/database/table-data
     * Inspect rows inside a specific table with live data viewer
     */
    public function tableData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_name' => ['required', 'string'],
            'page'       => ['nullable', 'integer', 'min:1'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:100'],
            'search'     => ['nullable', 'string'],
            'sort_by'    => ['nullable', 'string'],
            'sort_dir'   => ['nullable', 'in:asc,desc'],
        ]);

        $tableName = $validated['table_name'];

        if (!Schema::hasTable($tableName)) {
            return response()->json(['message' => "Table '{$tableName}' does not exist."], 404);
        }

        $columns = Schema::getColumnListing($tableName);
        $primaryKey = null;

        // Get column metadata in MySQL
        $columnMetadata = [];
        if (DB::getDriverName() === 'mysql') {
            $dbName = DB::getDatabaseName();
            $meta = DB::select("
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION ASC
            ", [$dbName, $tableName]);

            foreach ($meta as $col) {
                if ($col->COLUMN_KEY === 'PRI' && !$primaryKey) {
                    $primaryKey = $col->COLUMN_NAME;
                }
                $columnMetadata[] = [
                    'name'     => $col->COLUMN_NAME,
                    'type'     => $col->DATA_TYPE,
                    'nullable' => $col->IS_NULLABLE === 'YES',
                    'key'      => $col->COLUMN_KEY,
                    'default'  => $col->COLUMN_DEFAULT,
                ];
            }
        } else {
            foreach ($columns as $c) {
                $columnMetadata[] = [
                    'name'     => $c,
                    'type'     => 'string',
                    'nullable' => true,
                    'key'      => '',
                    'default'  => null,
                ];
            }
        }

        if (!$primaryKey) {
            $primaryKey = in_array('id', $columns, true) ? 'id' : ($columns[0] ?? null);
        }

        $query = DB::table($tableName);

        // Search across text/varchar/int columns
        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($columns, $search) {
                foreach ($columns as $index => $col) {
                    if ($index === 0) {
                        $q->where($col, 'LIKE', "%{$search}%");
                    } else {
                        $q->orWhere($col, 'LIKE', "%{$search}%");
                    }
                }
            });
        }

        // Sorting
        $sortBy = $validated['sort_by'] ?? ($primaryKey ?: (in_array('created_at', $columns, true) ? 'created_at' : $columns[0]));
        $sortDir = $validated['sort_dir'] ?? 'desc';

        if (in_array($sortBy, $columns, true)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = $validated['per_page'] ?? 15;
        $paginated = $query->paginate($perPage);

        // Mask sensitive password/token fields
        $sensitiveFields = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'otp_code'];
        $transformedItems = collect($paginated->items())->map(function ($row) use ($sensitiveFields) {
            $array = (array) $row;
            foreach ($sensitiveFields as $field) {
                if (isset($array[$field]) && !is_null($array[$field])) {
                    $array[$field] = '••••••••';
                }
            }
            return $array;
        });

        return response()->json([
            'table_name'   => $tableName,
            'primary_key'  => $primaryKey,
            'columns'      => $columnMetadata,
            'total_rows'   => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'per_page'     => $paginated->perPage(),
            'last_page'    => $paginated->lastPage(),
            'rows'         => $transformedItems,
        ]);
    }

    /**
     * POST /api/developer/database/bulk-truncate
     * Truncate multiple specified tables
     */
    public function bulkTruncate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_names'   => ['required', 'array'],
            'table_names.*' => ['string'],
        ]);

        $tables = $validated['table_names'];
        $deletedSummary = [];
        $totalDeleted = 0;

        Schema::disableForeignKeyConstraints();

        foreach ($tables as $table) {
            if ($table === 'migrations') continue;

            if (Schema::hasTable($table)) {
                try {
                    $count = DB::table($table)->count();
                    if (DB::getDriverName() === 'pgsql') {
                        DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE;");
                    } else {
                        DB::statement("TRUNCATE TABLE `{$table}`;");
                    }
                    $deletedSummary[$table] = $count;
                    $totalDeleted += $count;
                } catch (\Throwable $e) {
                    \Log::error("Failed bulk truncating {$table}: " . $e->getMessage());
                }
            }
        }

        Schema::enableForeignKeyConstraints();
        Cache::flush();

        try {
            AuditLog::record(
                'database_bulk_truncate',
                'database',
                "Developer executed bulk truncate on " . count($deletedSummary) . " tables ({$totalDeleted} total records).",
                [
                    'tables'        => array_keys($deletedSummary),
                    'total_deleted' => $totalDeleted,
                ]
            );
        } catch (\Throwable) {}

        return response()->json([
            'message'         => "Successfully truncated " . count($deletedSummary) . " tables ({$totalDeleted} records removed).",
            'tables'          => array_keys($deletedSummary),
            'records_deleted' => $totalDeleted,
            'breakdown'       => $deletedSummary,
        ]);
    }

    /**
     * Helper: get all table names
     */
    protected function getAllTableNames(): array
    {
        $dbName = DB::getDatabaseName();
        $tables = [];

        if (DB::getDriverName() === 'mysql') {
            $rows = DB::select("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [$dbName]);
            foreach ($rows as $r) {
                $tables[] = $r->TABLE_NAME;
            }
        } else {
            $rows = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
            foreach ($rows as $r) {
                $tables[] = $r->table_name ?? $r->TABLE_NAME;
            }
        }

        return $tables;
    }

    /**
     * Helper: classify table into logical group
     */
    protected function classifyTable(string $table): string
    {
        foreach ($this->categories as $cat => $names) {
            if (in_array($table, $names, true)) {
                return $cat;
            }
        }
        return 'other';
    }

    /**
     * Helper: format bytes to human-readable size
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int) floor(log($bytes, 1024));
        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }
}
