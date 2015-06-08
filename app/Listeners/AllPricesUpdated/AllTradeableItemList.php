<?php namespace App\Listeners\AllPricesUpdated;

use App\Events\AllPricesUpdated;
use App\Models\CacheItem;
use App\Models\Item;
use Redis;

class AllTradeableItemList
{

    public static $key = 'all';

    private $keys = [
        'id',
        'name_en',
        'name_de',
        'name_fr',
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

        // Get all tradeable items
        $ids = (new Item)->where('tradeable', true)->lists('id');
        $ids = CacheItem::prefixIdentifier($ids);

        // Grab the collection of requested items
        $collection = Redis::mget($ids);

        foreach ($collection as &$item) {

            $item = unserialize($item);

            if (!$item) {
                continue;
            }

            // Only save a few keys, so we don't blow up the redis storage D:
            $item = array_reverse_dot(array_only(array_dot($item), $this->keys));

        }

        // Save them into the cache under the specified key
        Redis::set(CacheItem::$cache_prefix . self::$key, serialize($collection));

    }

}