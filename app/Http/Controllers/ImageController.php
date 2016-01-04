<?php namespace App\Http\Controllers;

use Storage;

class ImageController extends Controller
{

    /**
     * Show a image by hash in the specified size
     *
     * @param $hash
     * @param $size
     * @return $this
     */
    public function show($hash, $size)
    {
        $content = Storage::get('images/' . $hash . '-' . $size . '.png');
        return $this->apiResponse($content, 2678400, 'image/png');
    }

}