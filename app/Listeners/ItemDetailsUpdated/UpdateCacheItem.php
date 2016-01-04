<?php namespace App\Listeners\ItemDetailsUpdated;

use App\Events\ItemDetailsUpdated;
use App\Models\CacheItem;

class UpdateCacheItem
{

    /**
     * Update or create an item in cache from the database item
     *
     * @param ItemDetailsUpdated $event
     * @return \App\Models\Item
     */
    public function handle(ItemDetailsUpdated $event)
    {
        $item = $event->item;

        $cache_item = new CacheItem();
        $cache_item->createOrUpdate($item->id, $item->toArray());

        return $item;
    }
}
