<?php

use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fallback redirect: if anyone hits the backend URL for an interview room, redirect to the frontend SPA
Route::get('/interview/{id}/room', function ($id) {
    $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
    return redirect()->away("{$frontendUrl}/interview/{$id}/room");
});

// Direct Web Diagnostic SMTP Test Endpoints
Route::match(['get', 'post'], '/test-email', [NotificationController::class, 'testEmail']);
Route::match(['get', 'post'], '/api/test-email', [NotificationController::class, 'testEmail']);
Route::match(['get', 'post'], '/api/public/test-email', [NotificationController::class, 'testEmail']);
