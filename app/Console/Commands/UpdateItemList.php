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

        $api = new ItemAPI();

        // Get the list of all available items and see which
        // ones are not in the database yet
        $available_ids = $api->getList();

        if (!$this->option('force')) {
            $existing_ids = Item::lists('id');
            $available_ids = array_diff($available_ids, $existing_ids);
        }

        $this->info('Updating ' . count($available_ids) . ' items');

        // For each new item, add a queue to grab the detail stuff
        foreach ($available_ids as $id) {
            Queue::push(new UpdateItemDetails($id));
        }

        $this->info('Done adding queue entries');

    }

}