<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>GW2-API</title>
    <link href='http://fonts.googleapis.com/css?family=Lato:100,300|Source+Code+Pro:300' rel='stylesheet'
          type='text/css'>
    <link rel="stylesheet" href="css/styles.css">
</head>

<body>

<div class="container">

    <h1>GW2-API</h1>

    <h2>Proxy-layer for the official item, tradingpost and render API.<br>For applications or spreadsheets. Fair use.
    </h2>

    <div class="navigation">
        <h2>Reference</h2>

        <a href="#item">/item/{id}</a><br>
        <a href="#items">/items/{ids}</a><br>
        <a href="#all-items">/items/all</a><br>
        <a href="#categories">/items/categories</a><br>
        <a href="#image">/image/{hash}/{size}</a><br>
    </div>

    <div class="content">

        <section class="endpoint">
            <a name="item"><h1>/item/{id}</h1></a>

            This endpoint returns a single item. The prices get updated about every minute and get don't get cached.

            <h2>Parameters</h2>
            <ul class="parameters">
                <li class="required">
                    <pre>id (required)</pre>
                    An item id, either in the url, as a GET or POST parameter or in ://input
                </li>
                <li class="optional">
                    <pre>lang (optional)</pre>
                    The requested result language, defaulting to english. Available: en, de, fr, es
                </li>
                <li class="optional">
                    <pre>attributes (optional)</pre>
                    An array or a comma separated list of the requested attributes. Available attributes are
                    <ul>
                        <li>
                            <pre>id</pre>
                            The item identifier
                        </li>
                        <li>
                            <pre>name</pre>
                            The localized name of the item, based on the supplied language
                        </li>
                        <li>
                            <pre>description</pre>
                            The localized description of the item, based on the supplied language
                        </li>
                        <li>
                            <pre>level</pre>
                            The item level
                        </li>
                        <li>
                            <pre>rarity</pre>
                            The item rarity, from 0 (Basic) to 6 (Legendary)
                        </li>
                        <li>
                            <pre>image</pre>
                            An image hash to use with the image endpoint
                        </li>
                        <li>
                            <pre>category.0</pre>
                            The item main category, as a number from the category endpoint
                        </li>
                        <li>
                            <pre>category.1</pre>
                            The item sub category, as a number from the category endpoint
                        </li>
                        <li>
                            <pre>vendor_price</pre>
                            The item vendor price
                        </li>
                        <li>
                            <pre>tradeable</pre>
                            A boolean flag if the item is tradeable or not
                        </li>
                        <li>
                            <pre>buy.quantity</pre>
                            The available quantity of buy orders
                        </li>
                        <li>
                            <pre>buy.price</pre>
                            The currently highest buy price
                        </li>
                        <li>
                            <pre>buy.last_change.time</pre>
                            The last time the buy price changed
                        </li>
                        <li>
                            <pre>buy.last_change.quantity</pre>
                            The last quantity change
                        </li>
                        <li>
                            <pre>buy.last_change.price</pre>
                            The last buy price change
                        </li>
                        <li>
                            <pre>sell.quantity</pre>
                            The available quantity of sell orders
                        </li>
                        <li>
                            <pre>sell.price</pre>
                            The currently lowest sell price
                        </li>
                        <li>
                            <pre>sell.last_change.time</pre>
                            The last time the sell price changed
                        </li>
                        <li>
                            <pre>sell.last_change.quantity</pre>
                            The last quantity change
                        </li>
                        <li>
                            <pre>sell.last_change.price</pre>
                            The last sell price change
                        </li>
                        <li>
                            <pre>last_update</pre>
                            The last time the prices of this item got updated
                        </li>
                    </ul>
                </li>
            </ul>

            <h2>Example</h2>
        <pre class="example">
GET http://gw2-api.local/item/123

<div class="separator">---</div>
{
    "id": 123,
    "name": "Zho's Mask",
    "level": 80,
    "rarity": 5,
    "image": "7fec7af0ac62e1f2b8d3b4337c7dbc28",
    "category": [
        0,
        3
    ],
    "vendor_price": 330,
    "buy": {
        "quantity": 94,
        "price": 4852,
        "last_change": {
            "time": "2015-06-09T05:55:44+0000",
            "quantity": 1,
            "price": 1
        }
    },
    "sell": {
        "quantity": 378,
        "price": 7635,
        "last_change": {
            "time": "2015-06-09T00:04:59+0000",
            "quantity": 16,
            "price": -140
        }
    },
    "last_update": "2015-06-09T05:55:44+0000"
}
    </pre>

        </section>


        <section class="endpoint">
            <a name="items"><h1>/items/{ids}</h1></a>

            This endpoint returns an array of items. The prices get updated every minute and get don't get cached.

            <h2>Parameters</h2>
            <ul class="parameters">
                <li class="required">
                    <pre>ids (required)</pre>
                    An array or a comma separated list of one or more item ids, either in the url, as a GET or POST
                    parameter or in ://input
                </li>
                <li class="optional">
                    <pre>lang (optional)</pre>
                    The requested result language, defaulting to english. Available: en, de, fr, es
                </li>
                <li class="optional">
                    <pre>attributes (optional)</pre>
                    An array or a comma separated list of the requested attributes. Available attributes are the same as
                    for
                    the
                    single item endpoint
                </li>
            </ul>

            <h2>Example</h2>
        <pre class="example">
GET http://gw2-api.local/items/123,456

<div class="separator">---</div>
[
    {
        "id": 123,
        "name": "Zho's Mask",
        "level": 80,
        "rarity": 5,
        "image": "7fec7af0ac62e1f2b8d3b4337c7dbc28",
        "category": [
            0,
            3
        ],
        "vendor_price": 330,
        "buy": {
            "quantity": 94,
            "price": 4852,
            "last_change": {
                "time": "2015-06-09T05:55:44+0000",
                "quantity": 1,
                "price": 1
            }
        },
        "sell": {
            "quantity": 378,
            "price": 7635,
            "last_change": {
                "time": "2015-06-09T00:04:59+0000",
                "quantity": 16,
                "price": -140
            }
        },
        "last_update": "2015-06-09T05:55:44+0000"
    },
    {
        "id": 456,
        "name": "Berserker's Reinforced Scale Boots of the Pack",
        "level": 74,
        "rarity": 3,
        "image": "cf6bb7e97bacb8aa3fd2c30a70a2f2d0",
        "category": [
            0,
            0
        ],
        "vendor_price": 122,
        "buy": {
            "quantity": 0,
            "price": 0,
            "last_change": {
                "time": "2015-06-06T22:29:41+0000",
                "quantity": 0,
                "price": 0
            }
        },
        "sell": {
            "quantity": 328,
            "price": 201,
            "last_change": {
                "time": "2015-06-07T22:24:27+0000",
                "quantity": 2,
                "price": -1
            }
        },
        "last_update": "2015-06-09T05:55:50+0000"
    }
]
    </pre>

        </section>


        <section class="endpoint">
            <a name="all-items"><h1>/items/all</h1></a>

            This endpoint returns an array of all tradeable items. The prices get updated every minute and get cached
            for one day on the user side.

            <h2>Parameters</h2>
            <ul class="parameters">
                <li class="optional">
                    <pre>lang (optional)</pre>
                    The requested result language, defaulting to english. Available: en, de, fr, es
                </li>
            </ul>

            <h2>Example</h2>
        <pre class="example">
GET http://gw2-api.local/items/all

<div class="separator">---</div>
[
    {
        "id": 123,
        "name": "Zho's Mask",
        "level": 80,
        "rarity": 5,
        "image": "7fec7af0ac62e1f2b8d3b4337c7dbc28",
        "category": [
            0,
            3
        ],
        "vendor_price": 330,
        "buy": {
            "quantity": 94,
            "price": 4852
        },
        "sell": {
            "quantity": 378,
            "price": 7635
        }
    },
    ...
]
    </pre>

        </section>

        <section class="endpoint">
            <a name="categories"><h1>/items/categories</h1></a>

            This endpoint returns an array of the item categories that are used as identifiers for the item endpoints

            <h2>Example</h2>
        <pre class="example">
GET http://gw2-api.local/items/categories

<div class="separator">---</div>
{
    "Armor": [
        0,
        {
            "Boots": 0,
            "Coat": 1,
            "Gloves": 2,
            "Helm": 3,
            "HelmAquatic": 4,
            "Leggings": 5,
            "Shoulders": 6
        }
    ],
    "Back": [
        1
    ],
    "Bag": [
        2
    ],
    ...
}
    </pre>

        </section>

        <section class="endpoint">
            <a name="image"><h1>/image/{hash}/{size}</h1></a>

            This endpoint is used to retrieve an image by a hash identifier returned by one of the item endpoints.
            The image gets updated on content updates and is cached on the user side for one month.

            <h2>Parameters</h2>
            <ul class="parameters">
                <li class="required">
                    <pre>hash (required)</pre>
                    A single image hash returned by one of the item endpoints.
                </li>
                <li class="required">
                    <pre>size (required)</pre>
                    One of the available sizes: 64, 32, 20
                </li>
            </ul>

            <h2>Example</h2>
        <pre class="example">
&lt;img src="http://gw2-api.local/image/7fec7af0ac62e1f2b8d3b4337c7dbc28/64"&gt;
&lt;img src="http://gw2-api.local/image/7fec7af0ac62e1f2b8d3b4337c7dbc28/32"&gt;
&lt;img src="http://gw2-api.local/image/7fec7af0ac62e1f2b8d3b4337c7dbc28/20"&gt;

<div class="separator">---</div>
<img src="http://gw2-api.local/image/7fec7af0ac62e1f2b8d3b4337c7dbc28/64">
<img src="http://gw2-api.local/image/7fec7af0ac62e1f2b8d3b4337c7dbc28/32">
<img src="http://gw2-api.local/image/7fec7af0ac62e1f2b8d3b4337c7dbc28/20">
</pre>

        </section>
    </div>

</div>

<a href="https://github.com/queicherius/gw2-api">
    <img style="position: absolute; top: 0; right: 0; border: 0;"
         src="https://camo.githubusercontent.com/38ef81f8aca64bb9a64448d0d70f1308ef5341ab/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6461726b626c75655f3132313632312e706e67"
         alt="Fork me on GitHub"
         data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png">
</a>

</body>
</html>