<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get a setting value by key with cache support and default fallback.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("system_setting_{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set a setting value and clear its cache.
     */
    public static function set(string $key, mixed $value): static
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
        );

        Cache::forget("system_setting_{$key}");
        Cache::forget('system_settings_all');

        return $setting;
    }

    /**
     * Retrieve all settings as an associative key-value array.
     */
    public static function getAllKeyValues(): array
    {
        return Cache::remember('system_settings_all', 3600, function () {
            $defaults = [
                'hotline_number' => '1500-ION',
                'whatsapp_number' => '6281234567890',
                'whatsapp_template' => 'Halo Tim ION Broadband, saya ingin melaporkan kendala koneksi internet pada nomor pelanggan saya.',
                'operational_hours' => 'Senin - Minggu, 08:00 - 22:00 WIB',
                'livechat_enabled' => '1',
                'retention_audit_logs_days' => '90',
                'retention_attachments_days' => '60',
                'auto_prune_enabled' => '1',
                'last_pruned_at' => '',
            ];

            $saved = static::pluck('value', 'key')->toArray();

            return array_merge($defaults, $saved);
        });
    }
}
