<?php namespace App\Console\Commands;

use App\Jobs\UpdateItemDetails;
use App\Models\Item;
use Queue;
use App\Api\Items as ItemAPI;
use App\Console\Command;

class UpdateItemList extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:update-item-list';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Update the database with the newest list of items";

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {

        $api = new ItemAPI();

        // Get the list of all available items and see which
        // ones are not in the database yet
        $available_ids = $api->getList();
        $existing_ids = Item::lists('id');
        $new_ids = array_diff($available_ids, $existing_ids);

        $this->info('Found ' . count($new_ids) . ' new items');

        // For each new item, add a queue to grab the detail stuff
        foreach ($new_ids as $id) {
            Queue::push(new UpdateItemDetails($id));
        }

        $this->info('Done adding queue entries');

    }

}