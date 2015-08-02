<?php namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Laravel\Lumen\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{

    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        'App\Console\Commands\UpdateItemList',
        'App\Console\Commands\UpdateItemPrices',
        'App\Console\Commands\RepopulateItems',
        'App\Console\Commands\RetryFailedJobs'
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {

        // Update the prices every five minutes. This may overlap, but always updates the newest prices.
        // Updating more frequently doesn't make sense, because prices are cached on GW2 side.
        $schedule->command('gw2:update-item-prices')->everyFiveMinutes();

        // Try and get new items every day
        $schedule->command('gw2:update-item-list')->daily()->at('2:00');

        // Repopulate the items from the database every day at 6, in case something broke
        $schedule->command('gw2:repopulate-items')->daily()->at('6:00');

    }
}
