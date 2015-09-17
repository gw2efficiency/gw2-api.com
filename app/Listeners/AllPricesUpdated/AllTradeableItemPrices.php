<?php namespace App\Listeners\AllPricesUpdated;

use App\Events\AllPricesUpdated;
use App\Models\CacheItem;
use App\Models\Item;
use Log;
use Redis;

class AllTradeableItemPrices
{

    public static $key = 'all-prices';

    /**
     * Save all tradeable items into one key for fast
     * and easy access when the user requests "all"
     *
     * @param AllPricesUpdated $event
     */
    public function handle(AllPricesUpdated $event)
    {

        Log::info('[AllTradeableItemPrices] Running');

        // Get all tradeable items
        $ids = (new Item)->where('tradeable', true)->lists('id');
        $ids = CacheItem::prefixIdentifier($ids);

        Log::info('[AllTradeableItemPrices] Grabbed ids');

        // Grab the collection of requested items
        $cached_items = Redis::mget($ids);
        $collection = [];

        Log::info('[AllTradeableItemPrices] Grabbed redis items');

        foreach ($cached_items as $item) {

            $item = unserialize($item);

            if (!isset($item['sell']['price'])) {
                continue;
            }

            // Only save a few keys, so we don't blow up the redis storage D:
            $collection[] = [
                'id' => $item['id'],
                'price' => $item['sell']['price'] > $item['buy']['price'] ? $item['sell']['price'] : $item['buy']['price']
            ];

        }

        Log::info('[AllTradeableItemPrices] Transformed collection');

        // Save them into the cache under the specified key
        Redis::set(CacheItem::$cache_prefix . self::$key, serialize($collection));

        Log::info('[AllTradeableItemPrices] Done');

    }

}