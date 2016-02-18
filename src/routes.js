const logger = require('./logger.js')
const ItemController = require('./controllers/item.js')
const GemController = require('./controllers/gem.js')

// Setup all routes
function setup (server, sharedCache) {
  const gem = new GemController(sharedCache)
  const item = new ItemController(sharedCache)

  server.get('/', (req, res, next) => res.redirect('https://github.com/gw2efficiency/gw2-api.com/', next))
  server.get('/item', bindController(item, 'handle'))
  server.get('/item/:id', bindController(item, 'handle'))
  server.get('/items', bindController(item, 'handle'))
  server.get('/items/:ids', bindController(item, 'handle'))
  server.get('/gems/history', bindController(gem, 'handle'))
}

// Use a controller function as a route with some basic settings
function bindController (controller, name) {
  let method = controller[name]
  return (req, res, next) => {
    logger.info('Receiving request: ' + req.path() + ' (' + controller.constructor.name + '.' + name + ')')

    // Set the cache and charset settings
    res.cache('public', {maxAge: 5 * 60})
    res.charSet('utf-8')

    // Overwrite the send function so it automatically triggers "next"
    res.sendParent = res.send
    res.send = (status, body) => {
      res.sendParent(status, body)
      next()
      logger.info('Sent response: ' + req.path() + ' (' + JSON.stringify(body || status).length + ' bit)')
    }

    // Call our controller function with the request and new response object
    method.apply(controller, [req, res])
  }
}

module.exports = setup
