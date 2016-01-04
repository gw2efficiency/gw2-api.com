<?php namespace App\Http\Controllers;

use App\Console\Commands\UpdateWardrobe;
use Redis;

class SkinsController extends Controller
{

    /**
     * Get all resolved skins
     *
     * @return $this
     */
    public function resolve()
    {
        $collection = Redis::get(UpdateWardrobe::$key);
        $collection = unserialize($collection);
        return $this->apiResponse($collection, 86400);
    }
}
