<?php namespace App\Http\Controllers;

use App\Api\Items;
use App\Models\CacheItem;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
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
     * Get the item category keys
     *
     * @return array
     */
    public function categories()
    {
        return $this->apiResponse(Items::$categories, 2678400);
    }

    /**
     * Get matching items for autocompletion stuff
     *
     * @return array
     */
    public function autocomplete()
    {

        // Request data
        $query = $this->getInput('q');
        $language = $this->requestedLanguage();
        $craftable = (int) $this->getInput('craftable');

        // No search for too short queries
        if (strlen($query) < 3) {
            return $this->apiResponse([], 2678400);
        }

        // Return the items that match the search query
        $matching = Item::select(['id', 'name_' . $language . ' AS name', 'image', 'rarity', 'level'])
            ->where('name_' . $language, 'LIKE', '%' . $query . '%')
            ->take(25);

        if ($craftable == 1) {
            $matching->where('craftable', true);
        }

        // Order by the best match and then alphabetically
        // 1) full name
        // 2) start of the name
        // 3) middle of the name
        // 4) end of the name
        $matching->orderByRaw("CASE
                                   WHEN name = ? THEN 0
                                   WHEN name LIKE ? THEN 1
                                   WHEN name LIKE ? THEN 3
                                   ELSE 2
                               END, name", [$query, $query . '%', '%' . $query]);

        $matching = $matching->get()->toArray();

        return $this->apiResponse($matching, 86400);

    }

    /**
     * Get items matching the names exactly
     *
     * @return array
     */
    public function byName()
    {

        // Request data
        $items = $this->getInput('names');

        if (!is_array($items)) {
            $items = explode(',', $items);
        }

        $items = array_values(array_unique($items));
        $language = $this->requestedLanguage();

        // Grab the item ids that match the query
        $ids = Item::whereIn(DB::raw('CAST(name_' . $language . ' AS BINARY)'), $items)->lists('id');
        return $this->items($ids);

    }

    /**
     * Get items matching the skin id
     *
     * @return array
     */
    public function bySkin()
    {

        // Request data
        $skin_id = $this->getInput('skin_id');

        // Grab the item ids that match the skin
        $ids = Item::where('skin', $skin_id)->lists('id');

        return $this->apiResponse($ids);

    }

    /**
     * Get items matching the query parameters
     *
     * @return array
     */
    public function query()
    {

        // I want to be able to say "give me the min / max / avg prices of all axes, swords and heavy armor, rare and exotic, except craftable"
        // I want to be able to say "give me the item ids of all ascended items that are craftable"

        // Request data
        $categories = $this->getInput('categories');
        $rarities = $this->getInput('rarities');
        $craftable = $this->getInput('craftable');
        $output = $this->getInput('output');

        $items = Item::select();

        if ($categories !== null) {
            $categories = explode(';', $categories);
            $items->whereIn('category', $categories);
        }

        if ($rarities !== null) {
            $rarities = explode(';', $rarities);
            $items->whereIn('rarity', $rarities);
        }

        if ($craftable !== null) {
            $items->where('craftable', $craftable);
        }

        $ids = $items->lists('id');

        if ($output !== 'prices') {
            return $this->apiResponse($ids);
        }

        $cache_items = array_filter($this->itemRequest($ids), function ($value) { return isset($value['buy']); });

        $buy_prices = array_pluck($cache_items, 'buy.price');
        $sell_prices = array_pluck($cache_items, 'sell.price');

        return $this->apiResponse([
            'buy' => [
                'min' => min($buy_prices),
                'avg' => round(array_sum($buy_prices) / count($buy_prices)),
                'max' => max($buy_prices)
            ],
            'sell' => [
                'min' => min($sell_prices),
                'avg' => round(array_sum($sell_prices) / count($sell_prices)),
                'max' => max($sell_prices)
            ]
        ]);

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
            unset($item['name_es']);

            // Rename "description" attribute
            $item['description'] = $item['description_' . $language];
            unset($item['description_en']);
            unset($item['description_de']);
            unset($item['description_fr']);
            unset($item['description_es']);

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