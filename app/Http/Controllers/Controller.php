<?php namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Laravel\Lumen\Routing\Controller as BaseController;

class Controller extends BaseController
{

    /**
     * Generate a response with proper headers
     *
     * @param     $content
     * @param int $age
     * @return $this
     */
    protected function apiResponse($content, $age = 0, $content_type = 'application/json')
    {

        return (new Response($content, 200))
            ->header('Content-Type', $content_type)
            ->header('Pragma', 'public')
            ->header('Cache-Control', 'max-age=' . $age . ', public')
            ->header('Expires', gmdate('D, d M Y H:i:s \G\M\T', time() + $age))
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    }

    /**
     * Get the input, by all means possible
     *
     * @param      $key
     * @param null $input
     * @return null
     */
    protected function getInput($key, $input = null)
    {

        // Get the input from the URL
        if ($input !== null) {
            return $input;
        }

        // Try to get the input from get parameters
        if (isset($_GET[$key])) {
            return $_GET[$key];
        }

        // Try to get the input from post parameters
        if (isset($_POST[$key])) {
            return $_POST[$key];
        }

        // Try to get input from php://input, which some JS frameworks use
        try {

            $request = json_decode(file_get_contents('php://input'), true);

            if (isset($request[$key])) {
                return $request[$key];
            }

        } catch (Exception $e) {

        }

        return null;

    }

    /**
     * Find out which language the requested results are in
     *
     * @return string
     */
    protected function requestedLanguage()
    {

        $lang = $this->getInput('lang');
        return in_array($lang, ['en', 'de', 'fr']) ? $lang : 'en';

    }

}