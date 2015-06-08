<?php namespace App\Console\Commands;

use App\Console\Command;
use App\Events\AllPricesUpdated;
use App\Events\ItemPricesUpdated;
use App\Models\CacheItem;
use App\Models\Item;
use Carbon\Carbon;
use Event;
use App\Api\Items as ItemAPI;

class UpdateItemPrices extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:update-item-prices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Update the cached items with the latest prices and statistics";

    private $price_api;

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {

        $this->price_api = new ItemAPI();

        // Get all tradeable items
        $tradeable_ids = (new Item)->where('tradeable', true)->lists('id');
        $count = count($tradeable_ids);

        $this->infoStart('Updating prices for ' . $count . ' items');

        // Grab 100 each from the api and directly update the cache
        $id_chunks = array_chunk($tradeable_ids, 100);

        foreach ($id_chunks as $ids) {

            $prices = $this->price_api->getPrices($ids);
            $price_ids = array_keys($prices);

            foreach ($price_ids as $id) {
                $this->updatePricesForItem($id, $prices[$id]);
            }

        }

        $this->infoFinish('Updating prices done');

        // Trigger an event for post-processor to hook into
        Event::fire(new AllPricesUpdated());

    }

    private function updatePricesForItem($id, $prices)
    {

        // Grab the item out of cache
        $item = (new CacheItem)->find($id);

        // No cache item found :(
        if (!$item) {
            return false;
        }

        // Save the previous values for post-processing
        $item->previous_values = [
            'buy' => $item->buy,
            'sell' => $item->sell
        ];

        // Update the item prices with the prices of the api
        $item->mergeAttributes($prices);

        // Trigger an event for post-processor to hook into
        $response = Event::fire(new ItemPricesUpdated($item));

        // Get the item after post processing
        $item = array_pop($response);

        // Remove the previous values
        unset($item['previous_values']);

        // Save the item back into cache
        $item->last_update = Carbon::now()->toIso8601String();
        $item->save();

    }

}