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

        ini_set('memory_limit', '500M');

        // Get all tradeable items
        $ids = (new Item)->where('tradeable', true)->lists('id');
        $ids = CacheItem::prefixIdentifier($ids);

        // Grab the collection of requested items
        $cached_items = Redis::mget($ids);
        $collection = [];

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

        // Save them into the cache under the specified key
        Redis::set(CacheItem::$cache_prefix . self::$key, serialize($collection));

        Log::info('[AllTradeableItemPrices] Saved all tradeable items prices');

    }

}