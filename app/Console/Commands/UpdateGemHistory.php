<?php namespace App\Console\Commands;

use App\Console\Command;
use Illuminate\Support\Facades\Redis;

class UpdateGemHistory extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:update-gem-history';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Update the official skins with item ids";

    public static $key = 'gem-history';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {

        // Yes, this is not the nicest way to do things. There is an API in the
        // documentation of spidy, but it's not enabled. We should probably
        // save our own history at some point.
        $gem_chart = json_decode(file_get_contents('http://www.gw2spidy.com/gem_chart'), true);

        $transformed = [
            'gold_to_gem' => $gem_chart[0]['data'],
            'gem_to_gold' => $gem_chart[2]['data'],
        ];

        Redis::set(self::$key, serialize($transformed));
    }
}
