<?php namespace App\Console\Commands;

use App\Console\Command;
use App\Models\Item;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class UpdateWardrobe extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:update-wardrobe';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = "Update the official skins with item ids";

    public static $key = 'resolved-skins';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function fire()
    {

        $this->infoStart('Getting official skin list...');
        $skins = $this->getOfficialSkinList();
        $this->infoFinish('Getting official skin done');

        $this->infoStart('Resolving skin ids to items...');
        $skins = $this->resolveSkinsToItems($skins);
        $this->infoFinish('Resolving skin ids to items done');

        if (count($skins) < 3500) {
            throw new Exception('Error updating skins' . print_r($skins, true));
        }

        Redis::set(self::$key, serialize($skins));

    }

    private function getOfficialSkinList()
    {

        $count = count(json_decode(file_get_contents('https://api.guildwars2.com/v2/skins'), true));
        $pages = ceil(($count / 50) - 1);

        $skins = [];

        for ($i = 0; $i <= $pages; $i++) {
            $content = json_decode(@file_get_contents('https://api.guildwars2.com/v2/skins?page=' . $i), true);
            $skins = array_merge($skins, $content);
        }

        // Filter the skins to only include skins that have names
        $skins = array_filter($skins, function ($x) { return isset($x['name']); });

        return $skins;

    }

    private function resolveSkinsToItems($skins)
    {

        // Cleanup the names
        foreach ($skins as &$skin) {
            $skin['name'] = trim($skin['name']);
        }

        // Try and grab the items for the skins
        $skins = $this->resolveItemsBySkinId($skins);
        $skins = $this->resolveItemsByName($skins);
        $skins = $this->resolveItemsBySkinName($skins);
        $skins = $this->resolveItemsBySloppyName($skins);
        $skins = $this->resolveItemsByWiki($skins);

        // Show which skins we are not resolving :(
        $this->info('Not being able to resolve ' . count($this->missingItems($skins)) . ' skins:');
        foreach ($skins as &$skin) {

            if (isset($skin['items'])) {
                continue;
            }

            $this->info('   > ' . $skin['name'] . '(' . $skin['id'] . ')');
            $skin['items'] = [];

        }

        // Build a return array!
        $return = [];
        foreach ($skins as $skin) {
            $return[(int) $skin['id']] = array_values(array_map('intval', array_unique($skin['items'])));
        }

        return $return;

    }

    /**
     * @param $skins
     * @return array
     */
    private function resolveItemsBySkinId($skins)
    {

        $skin_items = Item::select('skin', DB::raw("GROUP_CONCAT(DISTINCT id SEPARATOR ',') AS items"))
            ->whereIn('skin', array_pluck($skins, 'id'))
            ->groupBy('skin')
            ->lists('items', 'skin');

        foreach ($skins as &$skin) {

            if (!isset($skin_items[$skin['id']])) {
                continue;
            }

            $skin['items'] = explode(',', $skin_items[$skin['id']]);

        }

        $this->info('Resolved ' . count($skin_items) . ' skins by skin id...');

        return $skins;

    }

    private function resolveItemsByName($skins)
    {

        // Grab the names of the remaining skins
        $names = array_pluck($this->missingItems($skins), 'name');

        // Try to find them
        $name_items = Item::select('name_en', DB::raw("GROUP_CONCAT(DISTINCT id SEPARATOR ',') AS items"))
            ->whereIn('name_en', $names)
            ->groupBy('name_en')
            ->lists('items', 'name_en');

        foreach ($skins as &$skin) {

            $name = $skin['name'];

            if (!isset($name_items[$name])) {
                continue;
            }

            $skin['items'] = explode(',', $name_items[$name]);

        }

        $this->info('Resolved ' . count($name_items) . ' skins by name lookup...');

        return $skins;

    }

    private function resolveItemsBySkinName($skins)
    {

        $skinName = function ($skin) {
            return $skin . ' Skin';
        };

        // Grab the names of the remaining skins
        $names = array_map($skinName, array_pluck($skins, 'name'));

        // Try to find them
        $name_items = Item::select('name_en', DB::raw("GROUP_CONCAT(DISTINCT id SEPARATOR ',') AS items"))
            ->whereIn('name_en', $names)
            ->groupBy('name_en')
            ->lists('items', 'name_en');

        foreach ($skins as &$skin) {

            $name = $skinName($skin['name']);

            if (!isset($name_items[$name])) {
                continue;
            }

            $skin_items = explode(',', $name_items[$name]);

            if (isset($skin['items'])) {
                $skin['items'] = array_merge($skin['items'], $skin_items);
            } else {
                $skin['items'] = $skin_items;
            }

        }

        $this->info('Resolved ' . count($name_items) . ' skins by skin name lookup...');

        return $skins;

    }

    private function resolveItemsBySloppyName($skins)
    {

        $name_count = 0;

        foreach ($skins as &$skin) {

            if (isset($skin['items'])) {
                continue;
            }

            $items = Item::where('name_en', 'LIKE', $skin['name'] . '% Skin')->lists('id');

            if (count($items) == 0) {
                continue;
            }

            $skin['items'] = $items;
            $name_count++;

        }

        $this->info('Resolved ' . $name_count . ' skins by sloppy name lookup...');

        return $skins;

    }

    private function resolveItemsByWiki($skins)
    {

        $wiki_count = 0;

        foreach ($skins as &$skin) {

            if (isset($skin['items'])) {
                continue;
            }

            $items = $this->resolveSkinFromWiki($skin['name']);

            if (count($items) == 0) {
                continue;
            }

            $skin['items'] = $items;
            $wiki_count++;

        }

        $this->info('Resolved ' . $wiki_count . ' skins by wiki lookup...');

        return $skins;

    }

    private function resolveSkinFromWiki($name)
    {

        try {

            $content = file_get_contents('http://wiki.guildwars2.com/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=' . urlencode(trim($name)));
            $wiki_content = array_flatten(json_decode($content, true))[5];
            preg_match("/id = ([\d]*)/", $wiki_content, $matches);

            return count($matches) == 0 ? [] : [(int) $matches[1]];

        } catch (Exception $e) {

            return [];

        }

    }

    /**
     * @param $skins
     * @return array
     */
    private function missingItems($skins)
    {

        return array_where($skins, function ($key, $value) {
            return !isset($value['items']);
        });

    }

}