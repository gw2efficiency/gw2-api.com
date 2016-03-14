const logger = require('./helpers/logger.js')
const item = require('./controllers/item.js')
const gem = require('./controllers/gem.js')
const skin = require('./controllers/skin.js')
const recipe = require('./controllers/recipe.js')

function setupRoutes (server) {
  server.get('/', (req, res, next) => res.redirect('https://github.com/gw2efficiency/gw2-api.com/', next))
  anyMethod(server, '/item', wrapRequest(item.byId))
  anyMethod(server, '/item/:id', wrapRequest(item.byId))
  anyMethod(server, '/items', wrapRequest(item.byIds))
  anyMethod(server, '/items/all', wrapRequest(item.all))
  anyMethod(server, '/items/all-prices', wrapRequest(item.allPrices))
  anyMethod(server, '/items/categories', wrapRequest(item.categories))
  anyMethod(server, '/items/autocomplete', wrapRequest(item.autocomplete))
  anyMethod(server, '/items/by-name', wrapRequest(item.byName))
  anyMethod(server, '/items/by-skin', wrapRequest(item.bySkin))
  anyMethod(server, '/items/query', wrapRequest(item.query))
  anyMethod(server, '/items/:ids', wrapRequest(item.byIds))
  anyMethod(server, '/skins/resolve', wrapRequest(skin.resolve))
  anyMethod(server, '/recipe/nested/:id', wrapRequest(recipe.nested))
  anyMethod(server, '/gems/history', wrapRequest(gem.history))
}

// Adds get and post routes for a single url
function anyMethod (server, url, callback) {
  server.get(url, callback)
  server.post(url, callback)
}

// Wrap a request to offer a easier to use interface
function wrapRequest (callback) {
  return (request, response, next) => {
    // Set the default response settings
    response.cache('public', {maxAge: 5 * 60})
    setDefaultResponseHeaders(response)

    // Overwrite the send function so it automatically triggers "next"
    response.sendParent = response.send
    response.send = (status, body) => {
      response.sendParent(status, body)
      next()
    }

    // Call our controller function with the request and new response object
    callback(request, response)
  }
}

function setDefaultResponseHeaders (response) {
  response.charSet('utf-8')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
}

function setupErrorHandling (server) {
  server.on('NotFound', (req, res) => {
    logger.info('Failed Route: ' + req.path() + ' (route not found)')
    setDefaultResponseHeaders(res)
    res.send(404, {text: 'endpoint not found'})
  })

  server.on('MethodNotAllowed', (req, res) => {
    logger.info('Failed Route: ' + req.path() + ' (method not allowed)')
    setDefaultResponseHeaders(res)
    res.send(405, {text: 'method not allowed'})
  })

  server.on('uncaughtException', (req, res, route, err) => {
    logger.error('Failed Route: ' + req.path() + '\n' + err.stack)
    setDefaultResponseHeaders(res)
    res.send(500, {text: 'internal error'})
  })
}

module.exports = {setupRoutes, setupErrorHandling}
