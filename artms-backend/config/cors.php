<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Laravel CORS Configuration
    |--------------------------------------------------------------------------
    | Allow the React Vite frontend (Vercel / localhost) to communicate with
    | this Laravel API seamlessly with full preflight support.
    */

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://artms-orpin.vercel.app',
        '*',
    ],

    'allowed_origins_patterns' => [
        '*.vercel.app',
        '*.ngrok-free.app',
        '*.ngrok-free.dev',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['*'],

    'max_age' => 86400,

    'supports_credentials' => false,
];
