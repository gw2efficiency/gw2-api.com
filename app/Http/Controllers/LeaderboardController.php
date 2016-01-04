<?php namespace App\Http\Controllers;

use App\Console\Commands\UpdatePvpLeaderboard;
use Redis;

class LeaderboardController extends Controller
{

    /**
     * Get all leaderboard data
     *
     * @return $this
     */
    public function pvpIndex()
    {
        $collection = Redis::get(UpdatePvpLeaderboard::$key);
        $collection = unserialize($collection);
        return $this->apiResponse($collection, 12 * 60 * 60);
    }

    /**
     * Get a single user
     *
     * @param $name
     * @return $this
     */
    public function pvpByUser($name)
    {
        $name = urldecode($name);

        $collection = Redis::get(UpdatePvpLeaderboard::$key);
        $collection = unserialize($collection);

        // Grab the elements matching the name from all regions
        $eu = array_where($collection['eu'], function ($key, $value) use ($name) {
            return $value['name'] == $name;
        });

        $na = array_where($collection['na'], function ($key, $value) use ($name) {
            return $value['name'] == $name;
        });

        $element = array_values(array_merge($eu, $na));

        // Return the first element!
        $json = count($element) == 0 ? 'false' : $element[0];

        return $this->apiResponse($json, 12 * 60 * 60);
    }
}
