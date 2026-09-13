<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Storage file server route (supports both symlink and fallback routing)
Route::get('/storage/{path}', function (string $path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404, 'File not found');
    }
    return Storage::disk('public')->response($path);
})->where('path', '.*');
