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

        $category_map = [
            'Armor' => [
                0,
                [
                    'Boots' => 0,
                    'Coat' => 1,
                    'Gloves' => 2,
                    'Helm' => 3,
                    'HelmAquatic' => 4,
                    'Leggings' => 5,
                    'Shoulders' => 6
                ]
            ],
            'Back' => [1],
            'Bag' => [2],
            'Consumable' => [
                3,
                [
                    'AppearanceChange' => 0,
                    'Booze' => 1,
                    'ContractNpc' => 2,
                    'Food' => 3,
                    'Generic' => 4,
                    'Halloween' => 5,
                    'Immediate' => 6,
                    'Transmutation' => 7,
                    'Unlock' => 8,
                    'UnTransmutation' => 9,
                    'UpgradeRemoval' => 10,
                    'Utility' => 11
                ]
            ],
            'Container' => [
                4,
                [
                    'Default' => 0,
                    'GiftBox' => 1,
                    'OpenUI' => 2
                ]
            ],
            'CraftingMaterial' => [5],
            'Gathering' => [
                6,
                [
                    'Foraging' => 0,
                    'Logging' => 1,
                    'Mining' => 2
                ]
            ],
            'Gizmo' => [
                7,
                [
                    'Default',
                    'ContainerKey',
                    'RentableContractNpc',
                    'UnlimitedConsumable'
                ]
            ],
            'MiniPet' => [8],
            'Tool' => [
                9,
                [
                    'Salvage' => 0
                ]
            ],
            'Trait' => [10],
            'Trinket' => [
                11,
                [
                    'Amulet' => 0,
                    'Accessory' => 1,
                    'Ring' => 2
                ]
            ],
            'Trophy' => [12],
            'UpgradeComponent' => [
                13,
                [
                    'Default' => 0,
                    'Gem' => 1,
                    'Rune' => 2,
                    'Sigil' => 3,
                ]
            ],
            'Weapon' => [
                14,
                [
                    'Axe' => 0,
                    'Dagger' => 1,
                    'Focus' => 2,
                    'Greatsword' => 3,
                    'Hammer' => 4,
                    'Harpoon' => 5,
                    'LargeBundle' => 6,
                    'LongBow' => 7,
                    'Mace' => 8,
                    'Pistol' => 9,
                    'Rifle' => 10,
                    'Scepter' => 11,
                    'Shield' => 12,
                    'ShortBow' => 13,
                    'SmallBundle' => 14,
                    'Speargun' => 15,
                    'Staff' => 16,
                    'Sword' => 17,
                    'Torch' => 18,
                    'Toy' => 19,
                    'Trident' => 20,
                    'TwoHandedToy' => 21,
                    'Warhorn' => 22
                ]
            ]
        ];
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