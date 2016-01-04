<?php namespace App\Http\Controllers;

use App\Console\Commands\UpdateGemHistory;
use Redis;

class GemsController extends Controller
{

    /**
     * Get all leaderboard data
     *
     * @return $this
     */
    public function history()
    {
        $collection = Redis::get(UpdateGemHistory::$key);
        $collection = unserialize($collection);
        return $this->apiResponse($collection, 12 * 60 * 60);
    }
}
