<?php namespace App\Api;

class Items extends Api
{

    private $url = 'https://api.guildwars2.com/v2';

    public function getList()
    {
        return $this->json($this->url . '/items');
    }

    public function getDetails($id, $language = 'en')
    {

        $options = [
            'lang' => $language
        ];

        $url = $this->url($this->url . '/items/' . $id, $options);

        return $this->json($url);

    }

    public function getPrices($ids)
    {

        $options = [
            'ids' => implode(',', $ids)
        ];

        $url = $this->url($this->url . "/commerce/listings", $options);
        $items = $this->json($url);

        // Format items
        $formatted = [];

        foreach ($items as $item) {

            $formatted[$item['id']] = [
                'buy' => [
                    'quantity' => array_sum(array_pluck($item['buys'], 'quantity')),
                    'price' => isset($item['buys'][0]['unit_price']) ? $item['buys'][0]['unit_price'] : 0
                ],
                'sell' => [
                    'quantity' => array_sum(array_pluck($item['sells'], 'quantity')),
                    'price' => isset($item['sells'][0]['unit_price']) ? $item['sells'][0]['unit_price'] : 0
                ]
            ];

        }

        return $formatted;

    }

    public function chunkPrices($ids)
    {

        // Split the items into chunks that we can get from the official API
        $id_chunks = array_chunk($ids, 100);
        $prices = [];

        foreach ($id_chunks as $chunk) {
            $prices = $prices + $this->getPrices($chunk);
        }

        return $prices;

    }

}