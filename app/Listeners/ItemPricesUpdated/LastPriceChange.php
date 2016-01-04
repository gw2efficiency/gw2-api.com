<?php namespace App\Listeners\ItemPricesUpdated;

use App\Events\ItemPricesUpdated;
use Carbon\Carbon;

class LastPriceChange
{

    /**
     * Add "last change" statistics to buy and sell values
     *
     * @param ItemPricesUpdated $event
     * @return \App\Models\CacheItem
     */
    public function handle(ItemPricesUpdated $event)
    {
        $item = $event->item;
        $item->attributes['buy']['last_change'] = $this->getChange($item, 'buy');
        $item->attributes['sell']['last_change'] = $this->getChange($item, 'sell');

        return $item;
    }

    public function getChange($item, $type)
    {

        // Default attributes
        $attributes = [
            'time' => Carbon::now()->toIso8601String(),
            'quantity' => 0,
            'price' => 0
        ];

        // No previous values set, so return the default
        if (!$item->previous_values[$type]) {
            return $attributes;
        }

        // No change detected, return same thing again
        if ($item['previous_values'][$type]['price'] == $item[$type]['price']
            || $item['previous_values'][$type]['quantity'] == $item[$type]['quantity']) {
            return $item->previous_values[$type]['last_change'];
        }

        // Changes
        $attributes['quantity'] = $item[$type]['quantity'] - $item['previous_values'][$type]['quantity'];
        $attributes['price'] = $item[$type]['price'] - $item['previous_values'][$type]['price'];

        return $attributes;
    }
}
