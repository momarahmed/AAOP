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

    // ---------------------------------------------------------------
    // Federated SSO providers (OIDC). Each block follows the
    // {client_id, client_secret, redirect, discovery|endpoints, scopes} shape.
    // For Microsoft Entra ID, `tenant` selects the directory.
    // ---------------------------------------------------------------
    'sso' => [
        'frontend_callback' => env('AAOP_SSO_FRONTEND_CALLBACK', env('FRONTEND_URL', 'http://127.0.0.1:3000').'/login/sso/callback'),

        'google' => [
            'enabled'       => filter_var(env('SSO_GOOGLE_ENABLED', false), FILTER_VALIDATE_BOOL),
            'label'         => 'Google Workspace',
            'client_id'     => env('SSO_GOOGLE_CLIENT_ID'),
            'client_secret' => env('SSO_GOOGLE_CLIENT_SECRET'),
            'authorize_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
            'token_url'     => 'https://oauth2.googleapis.com/token',
            'userinfo_url'  => 'https://openidconnect.googleapis.com/v1/userinfo',
            'scopes'        => ['openid', 'email', 'profile'],
        ],

        'microsoft' => [
            'enabled'       => filter_var(env('SSO_MICROSOFT_ENABLED', false), FILTER_VALIDATE_BOOL),
            'label'         => 'Microsoft Entra ID',
            'client_id'     => env('SSO_MICROSOFT_CLIENT_ID'),
            'client_secret' => env('SSO_MICROSOFT_CLIENT_SECRET'),
            'tenant'        => env('SSO_MICROSOFT_TENANT', 'common'),
            'authorize_url' => 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
            'token_url'     => 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
            'userinfo_url'  => 'https://graph.microsoft.com/oidc/userinfo',
            'scopes'        => ['openid', 'email', 'profile', 'User.Read'],
        ],

        'okta' => [
            'enabled'       => filter_var(env('SSO_OKTA_ENABLED', false), FILTER_VALIDATE_BOOL),
            'label'         => 'Okta Workforce',
            'client_id'     => env('SSO_OKTA_CLIENT_ID'),
            'client_secret' => env('SSO_OKTA_CLIENT_SECRET'),
            'domain'        => env('SSO_OKTA_DOMAIN'),
            'authorize_url' => 'https://{domain}/oauth2/v1/authorize',
            'token_url'     => 'https://{domain}/oauth2/v1/token',
            'userinfo_url'  => 'https://{domain}/oauth2/v1/userinfo',
            'scopes'        => ['openid', 'email', 'profile'],
        ],
    ],

    // ---------------------------------------------------------------
    // WebAuthn — relying party config. `rp_id` MUST match the
    // SPA host (effective domain). For local dev we use `localhost`.
    // ---------------------------------------------------------------
    'webauthn' => [
        'rp_id'     => env('WEBAUTHN_RP_ID', 'localhost'),
        'rp_name'   => env('WEBAUTHN_RP_NAME', 'AAOP'),
        'origin'    => env('WEBAUTHN_ORIGIN', env('FRONTEND_URL', 'http://localhost:3000')),
        'timeout_ms'=> (int) env('WEBAUTHN_TIMEOUT_MS', 60000),
    ],
];
