# gw2-api.com

[![Travis](https://img.shields.io/travis/gw2efficiency/gw2-api.com.svg?style=flat-square)](https://travis-ci.org/gw2efficiency/gw2-api.com)
[![Coveralls](https://img.shields.io/coveralls/gw2efficiency/gw2-api.com/master.svg?style=flat-square)](https://coveralls.io/github/gw2efficiency/gw2-api.com?branch=master)

> Proxy-layer for the official GuildWars 2 API. // https://gw2-api.com

## Why?

> You can find the old php version before the rewrite under the [v0.1 release tag](https://github.com/queicherius/gw2-api/tree/v0.1).

**Past**

In the old days, before the official API, you could get item and price data
by requesting a session token from the official login page and then using the urls the tradingpost
used ingame as a unofficial API. 

This project originated when
I wanted to this data for a tradingpost section on https://gw2efficiency.com/, but I was not satisfied with the existing solutions (mainly because of cache time, update frequency and data format).

**Present**

Now, gw2efficiency still depends on this project and gets item data from https://gw2-api.com, even tho the official API
has gotten many more endpoints and a lot of things could be requested directly from it. Sadly in the way this page was written in PHP, it takes way too many resources to serve the millions of requests it gets every day. 

To fix this, and to try out the other node modules for gw2efficiency in a production environment, this project will get rewritten in node.js with resource management and performance in mind.

**Future**

In the future, https://gw2-api.com will stay online, but it will not be used in production anymore. Instead, it will be integrated into gw2efficiency directly.

## Roadmap

`TODO`
