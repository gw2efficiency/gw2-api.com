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
        'App\Console\Commands\RepopulateItems'
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {

        // Update the prices every minute (this overlaps, but always updates the newest prices)
        $schedule->command('gw2:update-item-prices')->cron('* * * * * *');

        // Repopulate the items from the database every day at 6, in case something broke
        $schedule->command('gw2:repopulate-items')->daily()->at('6:00');

        // Try and get new items every wednesday at 6 (since tuesday is patch-day)
        $schedule->command('gw2:update-item-list')->weekly()->wednesdays()->at('6:00');

    }
}
