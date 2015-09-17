<?php namespace App\Listeners\AllPricesUpdated;

use App\Events\AllPricesUpdated;
use App\Models\CacheItem;
use App\Models\Item;
use Log;
use Redis;

class AllTradeableItemList
{

    public static $key = 'all';

    private $keys = [
        'id',
        'name_en',
        'name_de',
        'name_fr',
        'name_es',
        'level',
        'rarity',
        'image',
        'category.0',
        'category.1',
        'vendor_price',
        'buy.quantity',
        'buy.price',
        'sell.quantity',
        'sell.price'
    ];

    /**
     * Save all tradeable items into one key for fast
     * and easy access when the user requests "all"
     *
     * @param AllPricesUpdated $event
     */
    public function handle(AllPricesUpdated $event)
    {

        Log::info('[AllTradeableItemList] Running');

        // Get all tradeable items
        $ids = (new Item)->where('tradeable', true)->lists('id');
        $ids = CacheItem::prefixIdentifier($ids);

        Log::info('[AllTradeableItemPrices] Grabbed ids');

        // Grab the collection of requested items
        $collection = Redis::mget($ids);

        Log::info('[AllTradeableItemPrices] Grabbed redis items');

        foreach ($collection as &$item) {

            $item = unserialize($item);

            if (!$item) {
                continue;
            }

            // Only save a few keys, so we don't blow up the redis storage D:
            $item = array_reverse_dot(array_only(array_dot($item), $this->keys));

        }

        Log::info('[AllTradeableItemPrices] Transformed collection');

        // Save them into the cache under the specified key
        Redis::set(CacheItem::$cache_prefix . self::$key, serialize($collection));

        Log::info('[AllTradeableItemList] Done');

    }

}