# [gw2-api.com](https://gw2-api.com)

[![Build Status](https://img.shields.io/travis/gw2efficiency/gw2-api.com.svg?style=flat-square)](https://travis-ci.org/gw2efficiency/gw2-api.com)
[![Coverage Status](https://img.shields.io/codecov/c/github/gw2efficiency/gw2-api.com/master.svg?style=flat-square)](https://codecov.io/github/gw2efficiency/gw2-api.com)

> Proxy-layer for the official GuildWars 2 API.

## Install

```
git clone https://github.com/gw2efficiency/gw2-api.com
cd gw2-api.com/
npm run-script build
node build/server.js
```

To keep the node process running, look into a process manager like [pm2](https://github.com/Unitech/pm2).


## Why? / History

> You can find the old PHP version before the rewrite under the [v0.1 release tag](https://github.com/queicherius/gw2-api/tree/v0.1).

**Past**

In the old days, before the official API, you could get item and price data
by requesting a session token from the official login page and then using the urls the tradingpost
used ingame as a unofficial API. 

This project originated when
I wanted to this data for a tradingpost section on [gw2efficiency.com](https://gw2efficiency.com/), but I was not satisfied with the existing solutions (mainly because of cache time, update frequency and data format).

**Present**

Now, [gw2efficiency.com](https://gw2efficiency.com/) still depends on this project and gets item data from [gw2-api.com](https://gw2-api.com), even tho the official API
has gotten many more endpoints and a lot of things could be requested directly from it. Sadly in the way this page was written in PHP, it takes way too many resources to serve the millions of requests it gets every day. 

To fix this, and to try out the other node modules for [gw2efficiency.com](https://gw2efficiency.com/) in a production environment, this project will get rewritten in node.js with resource management and performance in mind.

**Future**

In the future, [gw2-api.com](https://gw2-api.com) will stay online, but it will not be used in production anymore. Instead, it will be integrated into [gw2efficiency.com](https://gw2efficiency.com/) directly.

## Endpoints

- [ ] `/item`
- [ ] `/item/:id`
- [ ] `/items`
- [ ] `/items/all`
- [ ] `/items/all-prices`
- [ ] `/items/categories`
- [ ] `/items/autocomplete`
- [ ] `/items/by-name`
- [ ] `/items/by-skin`
- [ ] `/items/query`
- [ ] `/items/:ids`
- [ ] `/skins/resolve`
- [ ] `/recipe/nested/:id`
- [X] `/gems/history`

## Tests

```
npm test
```

## Licence

AGPL
