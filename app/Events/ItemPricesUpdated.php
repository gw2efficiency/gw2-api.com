<?php namespace App\Events;

use App\Models\CacheItem;

class ItemPricesUpdated
{

    public $item;

    function __construct(CacheItem $item)
    {
        $this->item = $item;
    }

}