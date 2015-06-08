<?php namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Intervention\Image\ImageManager;

class AppServiceProvider extends ServiceProvider
{

    /**
     * Register the application's event listeners.
     *
     */
    public function register()
    {

        $this->app['image'] = $this->app->share(function () {
            return new ImageManager(['driver' => 'gd']);
        });

        $this->app->alias('image', 'Intervention\Image\ImageManager');

    }

}