<?php namespace App\Http\Controllers;

use App\Models\CacheItem;
use Redis;

class ItemsController extends Controller
{

    /**
     * Get multiple items per url
     *
     * @param $ids
     * @return $this
     */
    public function items($ids)
    {
        $content = $this->itemRequest($ids);
        return $this->apiResponse($content);
    }

    /**
     * Get multiple items per query parameters
     *
     * @return ItemController
     */
    public function itemsQuery()
    {
        return $this->items(null);
    }

    /**
     * Get a single item per url
     *
     * @param $id
     * @return $this
     */
    public function item($id)
    {
        $content = $this->itemRequest($id);
        return $this->apiResponse($content[0]);
    }

    /**
     * Get a single item per query parameters
     *
     * @return ItemController
     */
    public function itemQuery()
    {
        return $this->item($this->getInput('id'));
    }

    /**
     * Request items
     *
     * @param null $ids
     * @return array|bool
     */
    private function itemRequest($ids = null)
    {

        // Request data
        $ids = $this->requestedIdentifiers($ids);
        $language = $this->requestedLanguage();
        $attributes = $this->requestedAttributes();

        if (!$ids) {
            return false;
        }

        // Grab the collection of requested items
        $collection = Redis::mget($ids);

        foreach ($collection as &$item) {

            $item = unserialize($item);

            if (!$item) {
                continue;
            }

            // Rename "name" attribute
            $item['name'] = $item['name_' . $language];
            unset($item['name_en']);
            unset($item['name_de']);
            unset($item['name_fr']);

            // Rename "description" attribute
            $item['description'] = $item['description_' . $language];
            unset($item['description_en']);
            unset($item['description_de']);
            unset($item['description_fr']);

            // Only return requested attributes
            $item = array_reverse_dot(array_only(array_dot($item), $attributes));

        }

        return $collection;

    }

    /**
     * Get the requested items' identifiers
     *
     * @param $ids
     * @return array|null
     */
    private function requestedIdentifiers($ids)
    {

        $ids = $this->getInput('ids', $ids);

        if (!$ids) {
            return false;
        }

        if (!is_array($ids)) {
            $ids = explode(',', $ids);
        }

        $ids = array_values(array_unique($ids));
        return CacheItem::prefixIdentifier($ids);

    }

    /**
     * Get the requested attributes
     *
     * @return array
     */
    private function requestedAttributes()
    {

        $default = [
            'id',
            'name',
            'level',
            'rarity',
            'image',
            'category.0',
            'category.1',
            'vendor_price',
            'buy.quantity',
            'buy.price',
            'buy.last_change.time',
            'buy.last_change.quantity',
            'buy.last_change.price',
            'sell.quantity',
            'sell.price',
            'sell.last_change.time',
            'sell.last_change.quantity',
            'sell.last_change.price',
            'last_update'
        ];

        $requested = $this->getInput('attributes') ?: $default;

        if (!is_array($requested)) {
            $requested = explode(',', $requested);
        }

        return $requested;

    }

}