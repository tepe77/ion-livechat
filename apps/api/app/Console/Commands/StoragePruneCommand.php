<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\Storage\StorageManagementService;
use Illuminate\Console\Command;

class StoragePruneCommand extends Command
{
    protected $signature = 'ion:storage-prune 
                            {--dry-run : Simulate pruning without deleting files or records}
                            {--audit-logs-days= : Override audit logs retention days}
                            {--attachments-days= : Override attachments retention days}
                            {--force : Run even if auto_prune_enabled is disabled}';

    protected $description = 'Prune expired audit logs and closed conversation attachments to preserve disk storage';

    public function handle(StorageManagementService $storageService): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        $autoPruneEnabled = Setting::get('auto_prune_enabled', '1') === '1';
        if (!$autoPruneEnabled && !$force && !$dryRun) {
            $this->info('Auto-prune is currently disabled in system settings. Use --force or enable it in admin.');
            return self::SUCCESS;
        }

        $this->info('Starting storage pruning' . ($dryRun ? ' (DRY RUN)' : '') . '...');

        $options = [
            'dry_run' => $dryRun,
        ];

        if ($this->option('audit-logs-days') !== null) {
            $options['retention_audit_logs_days'] = (int) $this->option('audit-logs-days');
        }

        if ($this->option('attachments-days') !== null) {
            $options['retention_attachments_days'] = (int) $this->option('attachments-days');
        }

        $result = $storageService->prune($options);

        $this->table(
            ['Metric', 'Value'],
            [
                ['Audit Logs Pruned', $result['deleted_audit_logs_count']],
                ['Attachments Pruned', $result['deleted_attachments_count']],
                ['Orphan Files Cleaned', $result['deleted_orphan_files_count']],
                ['Storage Space Freed', $result['freed_formatted']],
                ['Dry Run Mode', $result['dry_run'] ? 'Yes' : 'No'],
                ['Execution Timestamp', $result['executed_at']],
            ]
        );

        $this->info('Storage pruning completed successfully.');

        return self::SUCCESS;
    }
}
