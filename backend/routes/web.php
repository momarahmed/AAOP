<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    // The Next.js frontend owns the user-facing chrome; this endpoint
    // simply confirms the backend is reachable.
    return response()->json([
        'service'  => 'aaop-backend',
        'frontend' => config('app.frontend_url'),
        'docs'     => '/api/v1/openapi.json',
    ]);
});
