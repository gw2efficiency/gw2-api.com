<?php namespace App\Jobs;

use App\Events\ItemDetailsUpdated;
use Event;
use App\Api\Items as ItemAPI;
use App\Models\Item;
use Illuminate\Contracts\Bus\SelfHandling;
use Illuminate\Contracts\Queue\ShouldBeQueued;

class UpdateItemDetails extends Job implements SelfHandling, ShouldBeQueued
{

    private $id;

    /**
     * Create a new job instance.
     *
     * @param $id
     */
    public function __construct($id)
    {
        $this->id = $id;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {

        $api = new ItemAPI();
        $item = Item::findOrNew($this->id);

        // Item didn't exist yet, so set the model id
        if (!$item->exists) {
            $item->id = $this->id;
        }

        // Let's grab some details from the API
        $details['en'] = $api->getDetails($this->id, 'en');
        $details['de'] = $api->getDetails($this->id, 'de');
        $details['fr'] = $api->getDetails($this->id, 'fr');

        // Save the details in the model after some transformation
        $item = $this->processDetails($item, $details);

        // Fire off post processing events
        $response = Event::fire(new ItemDetailsUpdated($item));

        // Save the item after post processing
        $item = array_pop($response);
        $item->save();

    }

    /**
     * Process the data structures of the official API into something that is usable
     *
     * @param $item
     * @param $details
     * @return mixed
     */
    private function processDetails($item, $details)
    {

        $item->name_en = $details['en']['name'];
        $item->name_de = $details['de']['name'];
        $item->name_fr = $details['fr']['name'];

        $item->description_en = $this->processDescription($details['en']);
        $item->description_de = $this->processDescription($details['de']);
        $item->description_fr = $this->processDescription($details['fr']);

        $item->level = $this->processLevel($details['en']);

        $item->rarity = $this->processRarity($details['en']);

        $item->image = $details['en']['icon'];

        $item->category = $this->processCategory($details['en']);

        $item->vendor_price = $details['en']['vendor_value'];

        $item->tradeable = $this->processTradeable($details['en']);

        return $item;

    }

    /**
     * Get a clean description
     *
     * @param $item
     * @return null|string
     */
    private function processDescription($item)
    {

        if (!isset($item['description']) || $item['description'] == '') {
            return null;
        }

        return strip_tags($item['description']);

    }

    /**
     * Get a clean level
     *
     * @param $item
     * @return null|int
     */
    private function processLevel($item)
    {
        return ($item['level'] == 0) ? null : (int) $item['level'];
    }

    /**
     * Get a clean rarity
     *
     * @param $item
     * @return int
     */
    private function processRarity($item)
    {

        $rarity_map = [
            'Junk' => 0,
            'Basic' => 1,
            'Fine' => 2,
            'Masterwork' => 3,
            'Rare' => 4,
            'Exotic' => 5,
            'Ascended' => 6,
            'Legendary' => 7
        ];

        return $rarity_map[$item['rarity']];

    }

    /**
     * Get a clean category array
     *
     * @param $item
     * @return array
     */
    private function processCategory($item)
    {

        $category_map = ItemAPI::$categories;
        $categories = [];

        // No first type set, not in one of the categories. :(
        if (!isset($item['type'])) {
            return [];
        }

        // Grab the first type
        $main_category = $category_map[$item['type']];
        $categories[] = $main_category[0];

        // Second type not set, only return the first category
        if (!isset($item['details']['type'])) {
            return $categories;
        }

        // Grab the second type
        $categories[] = $main_category[1][$item['details']['type']];

        return $categories;

    }

    /**
     * Get a clean tradeable flag
     *
     * @param $item
     * @return bool
     */
    private function processTradeable($item)
    {

        $untradeable_flags = ['AccountBound', 'MonsterOnly', 'SoulbindOnAcquire'];
        $item_flags = array_intersect($untradeable_flags, $item['flags']);

        return count($item_flags) == 0;

    }

}