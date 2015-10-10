<?php namespace App\Console\Commands;

use App\Api\Recipes;
use App\Console\Command;
use App\Models\Item;
use Event;
use Redis;

class UpdateRecipes extends Command
{

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'gw2:update-recipes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate all available crafting recipes';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function fire()
    {

        $craftable_items = [];

        $recipe_api = new Recipes();
        $recipe_api->getCustomRecipes();

        // Go through all custom recipes
        $recipes = array_keys($recipe_api->custom_recipes);

        for ($i = 0; $i != count($recipes); $i++) {

            $id = $recipes[$i];
            $this->info($i . ' of ' . count($recipes) . ' custom recipes...');

            Redis::set('recipe-' . $id, serialize($recipe_api->getNested($id)));

            $craftable_items[] = $id;

        }

        // Go through all recipes
        $recipes = $recipe_api->getList();

        for ($i = 0; $i != count($recipes); $i++) {

            $this->info($i . ' of ' . count($recipes) . ' official recipes...');

            $recipe = $recipe_api->getOfficialRecipe($recipes[$i]);

            if (isset($recipe['text'])) {
                continue;
            }

            $id = $recipe['output_item_id'];
            Redis::set('recipe-' . $id, serialize($recipe_api->getNested($id)));

            $craftable_items[] = $id;

        }

        // Set the flag for all craftable items in the database,
        // so for the next repopulate they show up! :)
        Item::where('craftable', true)->update(['craftable' => false]);
        Item::whereIn('id', $craftable_items)->update(['craftable' => true]);

    }

}
