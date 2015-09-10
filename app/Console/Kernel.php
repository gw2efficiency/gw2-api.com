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
        'App\Console\Commands\RetryFailedJobs',
        'App\Console\Commands\UpdateWardrobe',
        'App\Console\Commands\UpdatePvpLeaderboard'
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {

        // Update the prices every five minutes. This may overlap, but always updates the newest prices.
        // Updating more frequently doesn't make sense, because prices are cached on GW2 side.
        $schedule->command('gw2:update-item-prices')->everyFiveMinutes();

        // Try and update the leaderboard twice a day
        $schedule->command('gw2:update-pvp-leaderboard')->twiceDaily();

        // Try and get new items every day
        $schedule->command('gw2:update-item-list')->daily()->at('2:00');

        // Try and update the wardrobe every day
        $schedule->command('gw2:update-wardrobe')->daily()->at('4:00');

        // Repopulate the items from the database every day at 6, in case something broke
        $schedule->command('gw2:repopulate-items')->daily()->at('6:00');

        // Retry everything queued that failed once a week
        $schedule->command('gw2:retry-failed-jobs')->weekly();

    }
}
