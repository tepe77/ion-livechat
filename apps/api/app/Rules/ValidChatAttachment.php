<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class ValidChatAttachment implements ValidationRule
{
    /**
     * Allowed photos: jpg, jpeg, png, webp (max 1MB / 1024 KB)
     * Allowed videos: mp4, webm, mov (max 50MB / 51200 KB)
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$value instanceof UploadedFile) {
            $fail('File yang dilampirkan tidak valid.');
            return;
        }

        if (!$value->isValid()) {
            $fail('Gagal mengunggah file. Pastikan ukuran file tidak melebihi batas sistem.');
            return;
        }

        // 1. Inspect real MIME type via PHP Fileinfo (reads magic bytes, not client header)
        $mime = $value->getMimeType();
        $extension = strtolower($value->getClientOriginalExtension());
        $sizeKb = $value->getSize() / 1024;
        $originalName = htmlspecialchars($value->getClientOriginalName(), ENT_QUOTES, 'UTF-8');

        // Security check: Block dangerous double extensions & executable scripts
        $lowerName = strtolower($value->getClientOriginalName());
        $dangerousPatterns = ['php', 'phtml', 'phar', 'exe', 'sh', 'bat', 'cmd', 'cgi', 'pl', 'py', 'js', 'jar', 'vbs', 'svg', 'html', 'htm'];
        foreach ($dangerousPatterns as $ext) {
            if (preg_match('/\\.' . preg_quote($ext, '/') . '(\\.|\\s|$)/i', $lowerName)) {
                $fail("File '{$originalName}' diblokir karena berpotensi mengandung skrip berbahaya.");
                return;
            }
        }

        $allowedImages = [
            'mimes' => ['image/jpeg', 'image/png', 'image/webp'],
            'exts' => ['jpg', 'jpeg', 'png', 'webp'],
            'maxKb' => 1024, // 1MB
        ];

        $allowedVideos = [
            'mimes' => ['video/mp4', 'application/mp4', 'video/webm', 'video/quicktime', 'video/x-quicktime'],
            'exts' => ['mp4', 'webm', 'mov'],
            'maxKb' => 51200, // 50MB
        ];

        // 2. Validate Image
        if (in_array($mime, $allowedImages['mimes']) && in_array($extension, $allowedImages['exts'])) {
            if ($sizeKb > $allowedImages['maxKb']) {
                $fail("Ukuran foto '{$originalName}' melebihi batas maksimal 1MB.");
                return;
            }

            // Security check: Decodability test (blocks polyglot and corrupted image files)
            $info = @getimagesize($value->getRealPath());
            if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP])) {
                $fail("File foto '{$originalName}' rusak atau bukan format gambar murni yang valid.");
                return;
            }
            return;
        }

        // 3. Validate Video
        if (in_array($mime, $allowedVideos['mimes']) && in_array($extension, $allowedVideos['exts'])) {
            if ($sizeKb > $allowedVideos['maxKb']) {
                $fail("Ukuran video '{$originalName}' melebihi batas maksimal 50MB.");
                return;
            }
            return;
        }

        $fail("File '{$originalName}' tidak didukung. Hanya file foto (JPG, PNG, WEBP maks. 1MB) dan video (MP4, WebM, MOV maks. 50MB) yang diperbolehkan.");
    }
}
