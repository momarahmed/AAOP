<?php

return [

    'name'      => env('APP_NAME', 'AAOP'),
    'env'       => env('APP_ENV', 'production'),
    'debug'     => (bool) env('APP_DEBUG', false),
    'url'       => env('APP_URL', 'http://127.0.0.1:8000'),
    'frontend_url' => env('FRONTEND_URL', 'http://127.0.0.1:3000'),

    'timezone'  => env('APP_TIMEZONE', 'UTC'),
    'locale'    => env('APP_LOCALE', 'en'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'faker_locale' => 'en_US',

    'cipher'    => 'AES-256-CBC',

    'key'       => env('APP_KEY'),
    'previous_keys' => array_filter(explode(',', (string) env('APP_PREVIOUS_KEYS', ''))),

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store'  => env('APP_MAINTENANCE_STORE', 'database'),
    ],

    // AAOP-specific config — exposed as `config('app.aaop.*')`
    'aaop' => [
        'audit_hash_secret' => env('AAOP_AUDIT_HASH_SECRET', 'change-me'),
        'tenant_default_region' => env('AAOP_TENANT_DEFAULT_REGION', 'us-ashburn-1'),
        'run_default_timeout' => (int) env('AAOP_RUN_DEFAULT_TIMEOUT', 600),
    ],

];
