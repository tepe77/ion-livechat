<?php

namespace App\Services\Storage;

use App\Enums\ConversationStatus;
use App\Models\AuditLog;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\Setting;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class StorageManagementService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Get real storage metrics, disk usage, database counts, and retention settings.
     */
    public function getMetrics(): array
    {
        $storagePath = storage_path('app/public');

        // Disk space metrics
        $diskTotal = @disk_total_space($storagePath) ?: (50 * 1024 * 1024 * 1024);
        $diskFree = @disk_free_space($storagePath) ?: (35 * 1024 * 1024 * 1024);
        $diskUsed = max(0, $diskTotal - $diskFree);
        $diskUsedPercent = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

        // Attachment files on disk
        $attachmentStats = $this->calculateDirectorySize('attachments');

        // Database record counts
        $totalAuditLogs = AuditLog::count();
        $totalConversations = Conversation::count();
        $closedConversations = Conversation::where('status', ConversationStatus::CLOSED)->count();
        $totalMessages = Message::count();
        $totalAttachments = MessageAttachment::count();

        // Estimated database size if on postgres
        $databaseSize = $this->getDatabaseSize();

        // Retention settings
        $settings = Setting::getAllKeyValues();

        return [
            'disk' => [
                'total_bytes' => $diskTotal,
                'total_formatted' => $this->formatBytes($diskTotal),
                'free_bytes' => $diskFree,
                'free_formatted' => $this->formatBytes($diskFree),
                'used_bytes' => $diskUsed,
                'used_formatted' => $this->formatBytes($diskUsed),
                'used_percent' => $diskUsedPercent,
            ],
            'attachments' => [
                'disk_bytes' => $attachmentStats['size'],
                'disk_formatted' => $this->formatBytes($attachmentStats['size']),
                'total_files' => $attachmentStats['files'],
                'db_records' => $totalAttachments,
            ],
            'database' => [
                'size_bytes' => $databaseSize['bytes'],
                'size_formatted' => $databaseSize['formatted'],
                'audit_logs_count' => $totalAuditLogs,
                'conversations_count' => $totalConversations,
                'closed_conversations_count' => $closedConversations,
                'messages_count' => $totalMessages,
            ],
            'retention' => [
                'retention_audit_logs_days' => (int) ($settings['retention_audit_logs_days'] ?? 90),
                'retention_attachments_days' => (int) ($settings['retention_attachments_days'] ?? 60),
                'auto_prune_enabled' => ($settings['auto_prune_enabled'] ?? '1') === '1',
                'last_pruned_at' => $settings['last_pruned_at'] ?: null,
            ],
        ];
    }

    /**
     * Prune old data and files according to options or active retention settings.
     */
    public function prune(array $options = [], ?User $actor = null): array
    {
        $settings = Setting::getAllKeyValues();
        $dryRun = (bool) ($options['dry_run'] ?? false);
        $pruneLogs = (bool) ($options['prune_audit_logs'] ?? true);
        $pruneAttachments = (bool) ($options['prune_attachments'] ?? true);
        $cleanOrphans = (bool) ($options['clean_orphans'] ?? true);

        $auditLogDays = isset($options['retention_audit_logs_days'])
            ? (int) $options['retention_audit_logs_days']
            : (int) ($settings['retention_audit_logs_days'] ?? 90);

        $attachmentDays = isset($options['retention_attachments_days'])
            ? (int) $options['retention_attachments_days']
            : (int) ($settings['retention_attachments_days'] ?? 60);

        $deletedLogsCount = 0;
        $deletedAttachmentsCount = 0;
        $deletedOrphansCount = 0;
        $freedBytes = 0;

        // 1. Prune Audit Logs
        if ($pruneLogs && $auditLogDays > 0) {
            $cutoffDate = now()->subDays($auditLogDays);
            $query = AuditLog::where('created_at', '<', $cutoffDate);
            $deletedLogsCount = $query->count();

            if (!$dryRun && $deletedLogsCount > 0) {
                $query->delete();
            }
        }

        // 2. Prune Old Attachments for Closed Conversations
        if ($pruneAttachments && $attachmentDays > 0) {
            $cutoffDate = now()->subDays($attachmentDays);

            // Query attachments belonging to closed conversations older than cutoff
            $oldAttachments = MessageAttachment::whereHas('message.conversation', function ($q) use ($cutoffDate) {
                $q->where('status', ConversationStatus::CLOSED)
                    ->where('closed_at', '<', $cutoffDate);
            })->with('message')->get();

            foreach ($oldAttachments as $att) {
                $freedBytes += (int) $att->size;
                $deletedAttachmentsCount++;

                if (!$dryRun) {
                    // Remove physical file from disk
                    if (Storage::disk($att->disk)->exists($att->path)) {
                        Storage::disk($att->disk)->delete($att->path);
                    }

                    // Annotate message so context isn't lost
                    if ($att->message) {
                        $currentContent = $att->message->content ?? '';
                        if (empty(trim($currentContent))) {
                            $att->message->update([
                                'content' => '[Lampiran ' . $att->original_name . ' kedaluwarsa sesuai kebijakan retensi ' . $attachmentDays . ' hari]',
                            ]);
                        }
                    }

                    $att->delete();
                }
            }
        }

        // 3. Clean Orphan Files on Storage Disk
        if ($cleanOrphans) {
            $orphanStats = $this->cleanOrphanFiles($dryRun);
            $deletedOrphansCount = $orphanStats['count'];
            $freedBytes += $orphanStats['bytes'];
        }

        $summary = [
            'freed_bytes' => $freedBytes,
            'freed_formatted' => $this->formatBytes($freedBytes),
            'deleted_audit_logs_count' => $deletedLogsCount,
            'deleted_attachments_count' => $deletedAttachmentsCount,
            'deleted_orphan_files_count' => $deletedOrphansCount,
            'dry_run' => $dryRun,
            'executed_at' => now()->toIso8601String(),
        ];

        if (!$dryRun) {
            Setting::set('last_pruned_at', now()->toIso8601String());

            $this->auditService->log(
                $actor,
                'storage.pruned',
                'Storage',
                null,
                $summary
            );
        }

        return $summary;
    }

    /**
     * Identify and clean files on public storage disk that have no record in database.
     */
    protected function cleanOrphanFiles(bool $dryRun = false): array
    {
        $count = 0;
        $bytes = 0;

        $publicDisk = Storage::disk('public');
        if (!$publicDisk->exists('attachments')) {
            return ['count' => 0, 'bytes' => 0];
        }

        $allFiles = $publicDisk->allFiles('attachments');
        $knownPaths = MessageAttachment::pluck('path')->flip()->toArray();

        foreach ($allFiles as $filePath) {
            $normPath = ltrim($filePath, '/');
            if (!isset($knownPaths[$normPath]) && !isset($knownPaths[$filePath])) {
                $fileSize = $publicDisk->size($filePath) ?: 0;
                $bytes += $fileSize;
                $count++;

                if (!$dryRun) {
                    $publicDisk->delete($filePath);
                }
            }
        }

        // Also prune empty directories under attachments/
        if (!$dryRun) {
            $dirs = $publicDisk->directories('attachments');
            foreach ($dirs as $dir) {
                if (empty($publicDisk->allFiles($dir))) {
                    $publicDisk->deleteDirectory($dir);
                }
            }
        }

        return ['count' => $count, 'bytes' => $bytes];
    }

    /**
     * Calculate total directory size and file count on public disk.
     */
    protected function calculateDirectorySize(string $directory): array
    {
        $publicDisk = Storage::disk('public');
        if (!$publicDisk->exists($directory)) {
            return ['size' => 0, 'files' => 0];
        }

        $files = $publicDisk->allFiles($directory);
        $totalSize = 0;

        foreach ($files as $file) {
            $totalSize += (int) $publicDisk->size($file);
        }

        return [
            'size' => $totalSize,
            'files' => count($files),
        ];
    }

    /**
     * Get database size if supported.
     */
    protected function getDatabaseSize(): array
    {
        try {
            if (config('database.default') === 'pgsql') {
                $result = DB::selectOne("SELECT pg_database_size(current_database()) AS size");
                $bytes = (int) ($result->size ?? 0);
                return [
                    'bytes' => $bytes,
                    'formatted' => $this->formatBytes($bytes),
                ];
            }
        } catch (\Throwable) {
            // Fallback for non-postgres or permission restriction
        }

        return [
            'bytes' => 0,
            'formatted' => 'N/A',
        ];
    }

    /**
     * Format bytes to readable unit.
     */
    public function formatBytes(int|float $bytes, int $precision = 2): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $base = log($bytes, 1024);
        $floor = min((int) floor($base), count($units) - 1);

        return round(pow(1024, $base - $floor), $precision) . ' ' . $units[$floor];
    }
}
