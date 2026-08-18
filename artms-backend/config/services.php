<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
    ],

    'google_ai' => [
        'key' => env('GOOGLE_AI_API_KEY'),
    ],

    'gemini' => [
        'key'         => env('GEMINI_API_KEY'),
        'reserve_key' => env('RESERVE_GEMINI_API_KEY'),
    ],

    'groq' => [
        'key' => env('GROQ_API_KEY'),
    ],

    'xai' => [
        'key' => env('XAI_API_KEY'),
    ],

    'livekit' => [
        'url'         => env('LIVEKIT_URL', env('LIVEKIT_HOST', 'wss://artms-8tdvtcz7.livekit.cloud')),
        'key'         => env('LIVEKIT_API_KEY'),
        'secret'      => env('LIVEKIT_API_SECRET'),
        'host'        => env('LIVEKIT_HOST', 'wss://artms-8tdvtcz7.livekit.cloud'),
        'webhook_url' => env('LIVEKIT_WEBHOOK_URL'),
        's3_key'      => env('LIVEKIT_EGRESS_S3_KEY', env('CLOUDFLARE_ACCESS_KEY_ID', env('AWS_ACCESS_KEY_ID'))),
        's3_secret'   => env('LIVEKIT_EGRESS_S3_SECRET', env('CLOUDFLARE_SECRET_ACCESS_KEY', env('AWS_SECRET_ACCESS_KEY'))),
        's3_bucket'   => env('LIVEKIT_EGRESS_S3_BUCKET', env('AWS_BUCKET', 'artms-interview-recordings')),
        's3_endpoint' => env('LIVEKIT_EGRESS_S3_ENDPOINT', env('CLOUDFLARE_ENDPOINT_URL', 'https://db3b8c571e7b2bc983841f11e25e2a44.r2.cloudflarestorage.com')),
        's3_region'   => env('LIVEKIT_EGRESS_S3_REGION', 'auto'),
    ],

    'xai' => [
        'key' => env('XAI_API_KEY'),
    ],

];
