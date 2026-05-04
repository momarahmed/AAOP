<?php

return [
    'mailgun' => [
        'domain'    => env('MAILGUN_DOMAIN'),
        'secret'    => env('MAILGUN_SECRET'),
        'endpoint'  => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],
    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'resend' => ['key' => env('RESEND_KEY')],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Optional HTTP MCP bridge (T-F13-04). When unset, the gateway returns
    | bundled dev stubs only.
    */
    'mcp' => [
        'remote_base' => env('AAOP_MCP_REMOTE_BASE'),
    ],

    'opa' => [
        'binary' => env('OPA_BINARY', 'opa'),
        // When true and `opa` is not on PATH, evaluation returns allow=true (tests / local sans OPA).
        'permissive_without_binary' => filter_var(
            env('AAOP_OPA_PERMISSIVE_WITHOUT_BINARY', false),
            FILTER_VALIDATE_BOOL
        ),
    ],
];
