<?php namespace App\Api;

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

    protected function json($url)
    {
        return json_decode($this->get($url), true);
    }

    protected function get($url)
    {
        return file_get_contents($url);
    }

}