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
        'App\Console\Commands\UpdatePvpLeaderboard',
        'App\Console\Commands\UpdateRecipes',
        'App\Console\Commands\UpdateGemHistory'
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
        $schedule->command('gw2:update-item-prices')->everyFiveMinutes()->sendOutputTo('storage/logs/item-prices.log');

        // Grab the gem history every half a hour, since we dont know how long this is cached for
        $schedule->command('gw2:update-gem-history')->everyThirtyMinutes();

        // Try and update the leaderboard twice a day
        $schedule->command('gw2:update-pvp-leaderboard')->twiceDaily();

        // Try and get new items every day, and force an update every sunday
        $schedule->command('gw2:update-item-list')->daily()->at('2:00');
        $schedule->command('gw2:update-item-list --force')->weeklyOn(0, '2:00');

        // Try and update the wardrobe every day
        $schedule->command('gw2:update-wardrobe')->daily()->at('4:00');

        // Try and update the recipes every day
        $schedule->command('gw2:update-recipes')->daily()->at('6:00');

        // Repopulate the items from the database every day at 8, in case something broke
        $schedule->command('gw2:repopulate-items')->daily()->at('8:00');

        // Retry everything queued that failed once a week
        $schedule->command('gw2:retry-failed-jobs')->weekly();

    }
}
