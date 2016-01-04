<?php namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{

    /**
     * The event handler mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        'App\Events\ItemDetailsUpdated' => [
            'App\Listeners\ItemDetailsUpdated\DownloadAndResizeImage',
            'App\Listeners\ItemDetailsUpdated\UpdateCacheItem'
        ],
        'App\Events\ItemPricesUpdated' => [
            'App\Listeners\ItemPricesUpdated\LastPriceChange'
        ],
        'App\Events\AllPricesUpdated' => [
            'App\Listeners\AllPricesUpdated\AllTradeableItemList',
            'App\Listeners\AllPricesUpdated\AllTradeableItemPrices'
        ]
    ];

    /**
     * Register the application's event listeners.
     *
     */
    public function register()
    {
        $events = $this->app['events'];

        foreach ($this->listen as $event => $listeners) {
            foreach ($listeners as $listener) {
                $events->listen($event, $listener);
            }
        }
    }
}
