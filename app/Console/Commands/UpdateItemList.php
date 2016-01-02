<?php namespace App\Console\Commands;

use App\Jobs\UpdateItemDetails;
use App\Models\Item;
use Queue;
use App\Api\Items as ItemAPI;
use App\Console\Command;
use Symfony\Component\Console\Input\InputOption;

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
     * Get the console command options.
     *
     * @return array
     */
    protected function getOptions()
    {
        return [
            ['id', null, InputOption::VALUE_REQUIRED, 'Force the command to update a single item'],
            ['force', null, InputOption::VALUE_NONE, 'Force the command to update all items']
        ];
    }

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {

        // Get the ids of the items to update
        $ids = $this->getIds();
        $this->info('Updating ' . count($ids) . ' items');

        // For each new item, add a queue to grab the detail stuff
        foreach ($ids as $id) {
            Queue::push(new UpdateItemDetails($id));
        }

        $this->info('Done adding queue entries');

    }

    private function getIds()
    {

        // Force update of a single item
        $id = $this->option('id');
        if ($id) {
            return [$id];
        }

        $api = new ItemAPI();

        // Get the list of all available items
        $available_ids = $api->getList();

        // Force an update of all items
        if ($this->option('force')) {
            return $available_ids;
        }

        // Filter the ids by what we have in the database
        $existing_ids = Item::lists('id');
        $available_ids = array_diff($available_ids, $existing_ids);
        return $available_ids;

    }

}