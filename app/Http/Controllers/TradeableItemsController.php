<?php namespace App\Http\Controllers;

use App\Listeners\AllPricesUpdated\AllTradeableItemList;
use App\Models\CacheItem;
use Redis;

class TradeableItemsController extends Controller
{

    /**
     * Get all tradeable items
     *
     * @return $this
     */
    public function items()
    {

        // Get the requested language
        $language = $this->requestedLanguage();

        // Grab the collection of requested items
        $collection = Redis::get(CacheItem::$cache_prefix . AllTradeableItemList::$key);
        $collection = unserialize($collection);

        // Go through the collection and clean up the attributes
        foreach ($collection as &$item) {

            // Rename "name" attribute
            $item['name'] = $item['name_' . $language];
            unset($item['name_en']);
            unset($item['name_de']);
            unset($item['name_fr']);

        }

        return $this->apiResponse($collection, 86400);

    }

}