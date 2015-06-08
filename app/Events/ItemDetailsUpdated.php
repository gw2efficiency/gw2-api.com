<?php namespace App\Events;

use App\Models\Item;

class ItemDetailsUpdated
{

    public $item;

    function __construct(Item $item)
    {
        $this->item = $item;
    }

}