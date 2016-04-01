# [gw2-api.com](https://gw2-api.com)

[![Build Status](https://img.shields.io/travis/gw2efficiency/gw2-api.com.svg?style=flat-square)](https://travis-ci.org/gw2efficiency/gw2-api.com)
[![Coverage Status](https://img.shields.io/codecov/c/github/gw2efficiency/gw2-api.com/master.svg?style=flat-square)](https://codecov.io/github/gw2efficiency/gw2-api.com)

> Proxy-layer server for the official GuildWars 2 API.

## Install

- **Requirements:**
  - [MongoDB](http://mongodb.org/) as the database layer
  - A process manager to keep the processes running, in this example [pm2](https://github.com/Unitech/pm2)
  - (Optional) Some sort of caching like [Varnish](https://www.varnish-cache.org/)

```sh
# Clone the repository and build the worker and server files
git clone https://github.com/gw2efficiency/gw2-api.com
cd gw2-api.com/
npm install
npm run build

# Start a server cluster with 10 processes
pm2 start build/server.js --name="gw2api-server" -i 10

# Start the background worker
pm2 start build/worker.js --name="gw2api-worker"
```

## Tests

**Note:** Requires a running instance of mongodb and will execute on a test database

```
npm test
```

## Endpoints

- [`/item/:id`](#itemid)
- [`/items/:ids`](#itemsids)
- [`/items/all`](#itemsall)
- [`/items/all-prices`](#itemsall-prices)
- [`/items/autocomplete`](#itemsautocomplete)
- [`/items/by-name`](#itemsby-name)
- [`/items/by-skin`](#itemsby-skin)
- [`/items/query`](#itemsquery)
- [`/items/categories`](#itemscategories)
- [`/skins/resolve`](#skinsresolve)
- [`/skins/prices`](#skinsprices)
- [`/recipe/nested/:id`](#recipenestedid)
- [`/gems/history`](#gemshistory)

### `/item/:id`

This endpoint returns a single item.

**Parameters**

- `id`: An item id, either in the url or as a GET/POST parameter
- `lang` (optional): The requested language (defaults to english)

```js
{
  "id": 123,
  "name": "Zho's Mask",
  "level": 80,
  "rarity": 5,
  "image": "https://...",
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
  "crafting": {
    "buy": 1337,
    "sell": 4242
  },
  "last_update": "2015-06-09T05:55:44+0000"
}
```

### `/items/:ids`

This endpoint returns an array of items.

**Parameters**

- `ids`: An array or a comma separated list of one or more item ids, either in the url or as a GET/POST parameter
- `lang` (optional): The requested language (defaults to english)

```js
[
  {
    "id": 123, 
    "name": "Zho's Mask", 
    // like /item/:id ...
  },
  // ...
]
```

### `/items/all`

This endpoint returns an array of all tradable items.

**Parameters**

- `lang` (optional): The requested language (defaults to english)

```js
[
  {
    "id": 123, 
    "name": "Zho's Mask", 
    // like /item/:id ...
  },
  // ...
]
```

### `/items/all-prices`

This endpoint returns an array of all tradable item ids with their prices.

**Parameters**

- `lang` (optional): The requested language (defaults to english)

```js
[
  {
    "id": 123, 
    "price": 1337
  },
  // ...
]
```

### `/items/autocomplete`

This endpoint returns an array of up to 20 items best matching the search query.

**Parameters**

- `q`: The term to search for in the item names
- `lang` (optional): The requested language (defaults to english)

```js
[
  {
    "id": 123,
    "name": "Zho's Mask",
    "level": 80,
    "rarity": 5,
    "image": "https://..."
  },
  // ...
]
```

### `/items/by-name`

This endpoint returns an array of all items matching the name exactly (case-sensitive!).

**Parameters**

- `names`: An array or a comma separated list of one or more item names, as a GET/POST parameter
- `lang` (optional): The requested language (defaults to english)

```js
[
  {
    "id": 123, 
    "name": "Zho's Mask", 
    // like /item/:id ...
  },
  // ...
]
```

### `/items/by-skin`

This endpoint returns an array of all item ids matching the skin id.

**Parameters**

- `skin_id`: An skin id, as a GET/POST parameter

```js
[
  123,
  124,
  125,
  // ...
]
```

### `/items/query`

This endpoint returns all items matching the query. 

**PLEASE DO NOT USE THIS HEAVILY** Please note that this endpoint is not as 
optimized as the others, since it should never be used directly user facing. This is
supposed to be only used for server-side tasks that run every once in a while.

**Parameters**

- `categories`: *Semicolon* separated list of category ids that the queried items must match
- `rarities`: *Semicolon* separated list of rarities that the queried items must match
- `craftable`: If set to any value, queried items must be craftable
- `exclude_name`: Queried items must exclude this string in their name
- `include_name`: Queried items must include this string in their name
- `output`: If set, returns a object with price information across all matches instead of item ids

```js
// output not set
[
  123,
  124,
  125,
  // ...
]

// output "prices"
{
  "buy": {
    "min": 123,
    "avg": 456,
    "max": 789
  },
  "sell": {
    "min": 123,
    "avg": 456,
    "max": 789
  }
}
```

### `/items/categories`

This endpoint returns an array of the item categories that are used as identifiers for the other item endpoints.

```js
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
  // ...
}
```

### `/skins/resolve`

This endpoint returns a list of all skin ids with their respective item ids.

```js
{
  "1": [2902,2903 /* ... */],
  "18":[2534,2535,2557 /* ... */],
  // ...
}
```

### `/skins/prices`

This endpoint returns a list of all buyable skin ids with their respective cheapest item price. 
(Note: the item price itself is the highest of buy price, sell price and vendor price)

```js
{
  "1": 123,
  "18": 456,
  // ...
}
```

### `/recipe/nested/:id`

This endpoint returns a nested recipe for that item (if a recipe exists). 
All components that can be crafted include their respective recipe and subcomponents.

**Parameters**

- `id`: An item id, either in the url or as a GET/POST parameter

```js
{
  "id": 31083,
  "output": 1,
  "quantity": 1,
  "components": [
    {
      "id": 20852,
      "quantity": 1
    },
    {
      "id": 13243,
      "quantity": 5,
      "output": 1,
      "components": [/* ... */]
    },
    // ...
  ]
}
```

### `/gems/history`

This endpoint returns price history data for gold to gems conversion.

```js
{
  "gold_to_gem": [
    [
      1347314400000, // timestamp in ms
      2747 // Conversion price (27s 47c per bought gem)
    ],
    [1347400800000,2735],
    // ...
  ],
  "gem_to_gold": [
    [
      1347314400000, // timestamp in ms
      1965 // conversion price (19s 65c per sold gem)
    ],
    [1347400800000,1956],
    // ...
  ]
```

## History and reasoning of this module

> You can find the old PHP version before the rewrite under the [v0.1 release tag](https://github.com/queicherius/gw2-api/tree/v0.1).

**Past**

In the old days, before the official API, you could get item and price data
by requesting a session token from the official login page and then using the urls the tradingpost
used ingame as a unofficial API. 

This project originated when
I wanted to this data for a tradingpost section on [gw2efficiency.com](https://gw2efficiency.com/), but I was not satisfied with the existing solutions (mainly because of cache time, update frequency and data format).

**Present**

Now, [gw2efficiency.com](https://gw2efficiency.com/) still depends on this project and gets item data 
from [gw2-api.com](https://gw2-api.com), even tho the official API has gotten many more endpoints and
a lot of things could be requested directly from it. Sadly in the way this page was written in PHP, 
it takes way too many resources to serve the millions of requests it gets every day. 

To fix this, and to extract re-usable modules that can get used for [gw2efficiency.com](https://gw2efficiency.com/) 
as well, this project has been rewritten in node.js with resource management and performance in mind.

**Future**

In the future, [gw2-api.com](https://gw2-api.com) will stay online for a while, but it will not be used 
in production anymore. Instead, it will be integrated into the API of
[gw2efficiency.com](https://gw2efficiency.com/) directly.

## Licence

AGPL
