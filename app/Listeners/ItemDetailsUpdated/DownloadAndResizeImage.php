<?php namespace App\Listeners\ItemDetailsUpdated;

use Storage;
use App\Events\ItemDetailsUpdated;
use Intervention\Image\ImageManager;

class DownloadAndResizeImage
{

    /**
     * Download and resize the image to serve it with proper
     * caching headers and sizes (looking at you, render API)
     *
     * @param ItemDetailsUpdated $event
     * @return \App\Models\Item
     */
    public function handle(ItemDetailsUpdated $event)
    {
        $item = $event->item;

        // Hash the name and use it as our image name
        $image_url = $item->image;
        $image_hash = md5($item->image);

        // Save the hash in the database instead
        $item->image = $image_hash;

        // Check if we already have the item in storage,
        // so we won't need to download it :)
        if (Storage::exists('images/' . $image_hash . '-64.png')) {
            return $item;
        }

        // Grab the image, resize it and put it into storage
        $image = (new ImageManager())->make(file_get_contents($image_url));
        Storage::put('images/' . $image_hash . '-64.png', $image->encode('png', 100));
        Storage::put('images/' . $image_hash . '-32.png', $image->resize(32, 32)->encode('png', 100));
        Storage::put('images/' . $image_hash . '-20.png', $image->resize(20, 20)->encode('png', 100));

        return $item;
    }
}
