const restify = require('restify')
const logger = require('./logger.js')
const api = require('gw2api-client')
const sharedCache = require('./cache.js')

// Setup the background workers
const ItemWorker = require('./workers/item.js')(api, sharedCache)
const GemWorker = require('./workers/gem.js')(api, sharedCache)
ItemWorker.initialize()
GemWorker.initialize()

// Setup the controllers
const GemController = require('./controllers/gem.js')(sharedCache)
const ItemController = require('./controllers/item.js')(sharedCache)

// Use a controller function as a route with some basic settings
let bindController = (controller, method) => {
  method = controller[method]
  return (req, res, next) => {
    res.cache('public', {maxAge: 5 * 60})
    res.charSet('utf-8')
    method.apply(controller, [req, res, next])
  }
}

// Set up the server
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())

server.get('/', (req, res, next) => res.redirect('https://github.com/gw2efficiency/gw2-api.com/', next))
server.get('/item', bindController(ItemController, 'handle'))
server.get('/item/:id', bindController(ItemController, 'handle'))
server.get('/items', bindController(ItemController, 'handle'))
server.get('/items/:ids', bindController(ItemController, 'handle'))
server.get('/gems/history', bindController(GemController, 'handle'))

server.on('NotFound', (req, res) => {
  logger.info('Failed Route: ' + req.path() + ' (route not found)')
  res.status(404)
  res.send({text: 'endpoint not found'})
})

server.on('MethodNotAllowed', (req, res) => {
  logger.info('Failed Route: ' + req.path() + ' (method not allowed)')
  res.status(405)
  res.send({text: 'method not allowed'})
})

server.on('uncaughtException', (req, res, route, err) => {
  logger.error('Failed Route: ' + req.path() + '\n' + err.stack)
  res.status(500)
  res.send({text: 'internal error'})
})

server.listen(8080, () => {
  logger.info('Server listening on port 8080')
})

// Export the server for testing purposes
module.exports = server
