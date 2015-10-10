<?php namespace App\Api;

class Recipes extends Api
{

    public $custom_recipes = [];

    /**
     * Get a list of all available recipes
     *
     * @return mixed
     */
    public function getList()
    {
        return $this->json('https://api.guildwars2.com/v2/recipes');
    }

    /**
     * Setup the custom recipes
     * This file is based on a forum thread, but doesn't include the material promotions
     * https://forum-en.guildwars2.com/forum/community/api/Created-a-json-file-for-Mystic-Forge-recipes
     */
    public function getCustomRecipes()
    {

        $recipes = $this->json('./database/json/custom-recipes.json');

        foreach ($recipes as $recipe) {
            $this->custom_recipes[$recipe['output_item_id']] = $recipe;
        }

    }

    /**
     * Get the full recipe from a item id, including all sub-recipes (if available)
     *
     * @param     $id
     * @param int $amount
     * @return array|bool
     */
    public function getNested($id, $amount = 1)
    {

        // Get the official recipe from the API
        $recipe = $this->getRecipe($id);

        if (!$recipe) {
            return false;
        }

        foreach ($recipe['components'] as &$component) {

            // Make the quantity based on the main recipe
            $component['quantity'] = $amount * $component['quantity'];

            // Check if we can craft the sub-component as well, and if yes,
            // generate a proper array for that component!
            $component_recipe = $this->getNested($component['id'], $component['quantity']);

            if (!$component_recipe) {
                continue;
            }

            // Update this component if we can craft the sub-component
            $component = [
                'id' => $component_recipe['id'],
                'quantity' => $component['quantity'],
                'output' => $component_recipe['quantity'],
                'components' => $component_recipe['components']
            ];

        }

        // Done with the components of this recipe, let's return!
        $recipe = [
            'id' => $recipe['id'],
            'quantity' => $recipe['output'],
            'components' => $recipe['components']
        ];

        return $recipe;

    }

    /**
     * Get the full recipe from either custom recipes or the official API
     *
     * @param $id
     * @return array|bool
     */
    private function getRecipe($id)
    {

        return $this->cache('inofficial-recipe-' . $id, 20 * 60 * 60, function () use ($id) {

            // It's a custom recipe (e.g. mystic forge)
            if (isset($this->custom_recipes[$id])) {
                return $this->transformRecipe($this->custom_recipes[$id]);
            }

            // Resolve the item into a recipe
            $recipe = $this->searchRecipeByOutput($id);

            if (!$recipe) {
                return false;
            }

            return $this->transformRecipe($this->getOfficialRecipe($recipe));

        });

    }

    /**
     * Search a recipe based on the item it outputs
     *
     * @param $item_id
     * @return bool
     */
    public function searchRecipeByOutput($item_id)
    {

        return $this->cache('official-recipe-search-' . $item_id, 20 * 60 * 60, function () use ($item_id) {

            $query = $this->json('https://api.guildwars2.com/v2/recipes/search?output=' . $item_id);
            return isset($query[0]) ? $query[0] : false;

        });

    }

    /**
     * Get a recipe from the official API
     *
     * @param $recipe
     * @return array|bool
     */
    public function getOfficialRecipe($recipe)
    {

        return $this->cache('official-recipe-' . $recipe, 20 * 60 * 60, function () use ($recipe) {

            return $this->json('https://api.guildwars2.com/v2/recipes/' . $recipe);

        });

    }

    /**
     * Transform recipe into something more usable
     *
     * @param $recipe
     * @return array
     */
    private function transformRecipe($recipe)
    {

        return [
            'id' => $recipe['output_item_id'],
            'output' => $recipe['output_item_count'],
            'components' => $this->transformIngredients($recipe['ingredients'])
        ];

    }

    /**
     * Generate a component array from the official API components
     *
     * @param $ingredients
     * @return mixed
     */
    private function transformIngredients($ingredients)
    {

        foreach ($ingredients as &$ingredient) {
            $ingredient = [
                'id' => $ingredient['item_id'],
                'quantity' => $ingredient['count']
            ];
        }

        return $ingredients;

    }

}