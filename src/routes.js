const logger = require('./helpers/logger.js')
const item = require('./controllers/item.js')
const gem = require('./controllers/gem.js')
const skin = require('./controllers/skin.js')

// Setup all routes
function setup (server) {
  server.get('/', (req, res, next) => res.redirect('https://github.com/gw2efficiency/gw2-api.com/', next))
  server.get('/item', wrapRequest(item.byId))
  server.get('/item/:id', wrapRequest(item.byId))
  server.get('/items', wrapRequest(item.byIds))
  server.get('/items/all', wrapRequest(item.all))
  server.get('/items/all-prices', wrapRequest(item.allPrices))
  server.get('/items/categories', wrapRequest(item.categories))
  server.get('/items/autocomplete', wrapRequest(item.autocomplete))
  server.get('/items/by-name', wrapRequest(item.byName))
  server.get('/items/by-skin', wrapRequest(item.bySkin))
  server.get('/items/query', wrapRequest(item.query))
  server.get('/items/:ids', wrapRequest(item.byIds))
  server.get('/skins/resolve', wrapRequest(skin.resolve))
  server.get('/gems/history', wrapRequest(gem.history))
}

// Wrap a request to offer a easier to use interface
function wrapRequest (callback) {
  return (request, response, next) => {
    logger.info('Receiving request: ' + request.path() + ' (' + callback.name + ')')

    // Set the cache and charset settings
    response.cache('public', {maxAge: 5 * 60})
    response.charSet('utf-8')

    // Overwrite the send function so it automatically triggers "next"
    response.sendParent = response.send
    response.send = (status, body) => {
      response.sendParent(status, body)
      next()
      logger.info('Sent response: ' + request.path() + ' (' + JSON.stringify(body || status).length + ' bit)')
    }

    // Call our controller function with the request and new response object
    callback(request, response)
  }
}

module.exports = setup
