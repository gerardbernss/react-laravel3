<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CopyToOracle extends Command
{
    protected $signature = 'db:copy-to-oracle';
    protected $description = 'Copy all data from the SQLite database into Oracle';

    public function handle(): int
    {
        // Set NLS format before OCI8 opens the connection — OCI8 reads these from env at connect time.
        putenv("NLS_DATE_FORMAT=YYYY-MM-DD HH24:MI:SS");
        putenv("NLS_TIMESTAMP_FORMAT=YYYY-MM-DD HH24:MI:SS.FF6");
        putenv("NLS_LANG=AMERICAN_AMERICA.AL32UTF8");

        $this->info('Configuring Oracle session...');
        DB::connection('oracle')->statement("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS'");
        DB::connection('oracle')->statement("ALTER SESSION SET NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF'");

        // Fetch all Oracle table names upfront so we can skip SQLite-only tables
        $oracleTables = collect(DB::connection('oracle')->select(
            "SELECT LOWER(table_name) AS table_name FROM user_tables"
        ))->pluck('table_name')->flip();

        $this->info('Disabling Oracle FK constraints...');
        DB::connection('oracle')->unprepared("
            BEGIN
              FOR r IN (SELECT table_name, constraint_name
                        FROM user_constraints WHERE constraint_type = 'R') LOOP
                EXECUTE IMMEDIATE 'ALTER TABLE ' || r.table_name ||
                                  ' DISABLE CONSTRAINT ' || r.constraint_name;
              END LOOP;
            END;
        ");

        $tables = DB::connection('sqlite')
            ->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

        $tableNames = collect($tables)->pluck('name');

        // Skip the migrations table — Oracle already has its own
        $tableNames = $tableNames->reject(fn($t) => $t === 'migrations');

        $this->info("Copying " . $tableNames->count() . " tables...");

        $bar = $this->output->createProgressBar($tableNames->count());
        $bar->start();

        foreach ($tableNames as $table) {
            try {
                // Skip tables that don't exist in Oracle (e.g. old tables dropped by migrations)
                if (!isset($oracleTables[$table])) {
                    $bar->advance();
                    continue;
                }

                $totalRows = DB::connection('sqlite')->table($table)->count();

                if ($totalRows === 0) {
                    $bar->advance();
                    continue;
                }

                // Clear Oracle table first (in case of partial previous run)
                DB::connection('oracle')->table($table)->delete();

                DB::connection('sqlite')->table($table)->orderBy(
                    DB::connection('sqlite')->raw('rowid')
                )->chunk(500, function ($rows) use ($table) {
                    $data = $rows->map(function ($row) {
                        return array_map([$this, 'transformValue'], (array) $row);
                    })->toArray();

                    DB::connection('oracle')->table($table)->insert($data);
                });

                $bar->advance();
            } catch (\Throwable $e) {
                $bar->clear();
                $this->warn("  [SKIP] {$table}: " . $e->getMessage());
                $bar->display();
            }
        }

        $bar->finish();
        $this->newLine();

        $this->info('Re-enabling Oracle FK constraints...');
        DB::connection('oracle')->unprepared("
            BEGIN
              FOR r IN (SELECT table_name, constraint_name
                        FROM user_constraints WHERE constraint_type = 'R') LOOP
                EXECUTE IMMEDIATE 'ALTER TABLE ' || r.table_name ||
                                  ' ENABLE NOVALIDATE CONSTRAINT ' || r.constraint_name;
              END LOOP;
            END;
        ");

        $this->info('Done. Verifying row counts...');
        $this->newLine();

        $rows = [['Table', 'SQLite', 'Oracle', 'Match']];
        foreach ($tableNames as $table) {
            if (!isset($oracleTables[$table])) {
                continue;
            }
            try {
                $sqlite = DB::connection('sqlite')->table($table)->count();
                $oracle = DB::connection('oracle')->table($table)->count();
                $rows[] = [$table, $sqlite, $oracle, $sqlite === $oracle ? '✓' : '✗ MISMATCH'];
            } catch (\Throwable) {
                $rows[] = [$table, '?', '?', 'error'];
            }
        }

        $this->table(['Table', 'SQLite', 'Oracle', 'Match'], \array_slice($rows, 1));

        return self::SUCCESS;
    }

    private function transformValue(mixed $value): mixed
    {
        if (!is_string($value)) {
            return $value;
        }

        // Time-only strings (HH:MM or HH:MM:SS) can't be stored in Oracle DATE columns
        // without a date part. Prefix with a dummy date so Oracle accepts them.
        if (preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', $value)) {
            $padded = strlen($value) === 5 ? $value . ':00' : $value;
            return '1970-01-01 ' . $padded;
        }

        return $value;
    }
}
