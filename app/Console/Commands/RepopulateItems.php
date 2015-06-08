<?php namespace App\Console\Commands;

use App\Models\CacheItem;
use App\Models\Item;
use App\Console\Command;

class RepopulateItems extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:repopulate-items';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Repopulate the cache items from the database";

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {

        $database_items = (new Item)->get();

        $this->infoStart('Repopulating ' . count($database_items) . ' items');

        foreach ($database_items as $item) {
            (new CacheItem)->createOrUpdate($item->id, $item->toArray());
        }

        $this->infoFinish('Done repopulating!');

    }

}