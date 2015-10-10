<?php namespace App\Api;

use Closure;
use Redis;

abstract class Api
{

    /**
     * Build a full url out of a base url and query parameters
     *
     * @param       $url
     * @param array $query_parameters
     * @return string
     */
    protected function url($url, $query_parameters = [])
    {

        if (count($query_parameters) == 0) {
            return $url;
        }

        return $url . '?' . urldecode(http_build_query($query_parameters));

    }

    /**
     * Get a specific url and decode it as json
     *
     * @param $url
     * @return mixed
     */
    protected function json($url)
    {
        return json_decode($this->get($url), true);
    }

    /**
     * Get a specific url from the API
     *
     * @param $url
     * @return string
     */
    protected function get($url)
    {
        return file_get_contents($url);
    }

    /**
     * Get an item from the cache, or store the default value.
     *
     * @param  string        $key
     * @param  \DateTime|int $minutes
     * @param  \Closure      $callback
     * @return mixed
     */
    protected function cache($key, $minutes, Closure $callback)
    {

        // If the item exists in the cache we will just return this immediately
        // otherwise we will execute the given Closure and cache the result
        // of that execution for the given number of minutes in storage.
        if (!is_null($value = Redis::get($key))) {
            return unserialize($value);
        }

        $value = $callback();
        Redis::setex($key, $minutes, serialize($value));

        return $value;

    }

}