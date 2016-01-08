<?php namespace App\Http\Controllers;

use Redis;

class RecipeController extends Controller
{

    /**
     * Get the full recipe path based on item id
     *
     * @param $id
     * @return array|string
     */
    public function get($id)
    {
        $recipe = Redis::get('recipe-' . $id);
        $recipe = unserialize($recipe);
        return $this->apiResponse($recipe, 86400);
    }
}
