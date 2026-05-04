<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Strict Eloquent — surfaces missing relations and unfilled attributes
        // early in development so we don't ship hidden bugs to staging.
        Model::shouldBeStrict(! app()->isProduction());

        // Force HTTPS when APP_URL is HTTPS (production only).
        if (app()->isProduction() && str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }
    }
}
