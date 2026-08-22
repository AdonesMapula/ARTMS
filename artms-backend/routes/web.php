<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fallback redirect: if anyone hits the backend URL for an interview room, redirect to the frontend SPA
Route::get('/interview/{id}/room', function ($id) {
    $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
    return redirect()->away("{$frontendUrl}/interview/{$id}/room");
});

