const restify = require('restify')
const logger = require('./logger.js')
const api = require('gw2api-client')
const sharedCache = require('./cache.js')
const setupRoutes = require('./routes.js')

// Setup the background workers
const ItemWorker = new (require('./workers/item.js'))(api, sharedCache)
const GemWorker = new (require('./workers/gem.js'))(api, sharedCache)
ItemWorker.initialize()
GemWorker.initialize()

// Setup the controller and routes
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())
setupRoutes(server, sharedCache)
server.listen(8080, () => logger.info('Server listening on port 8080'))

// Setup error handling
server.on('NotFound', (req, res) => {
  logger.info('Failed Route: ' + req.path() + ' (route not found)')
  res.send(404, {text: 'endpoint not found'})
})

server.on('MethodNotAllowed', (req, res) => {
  logger.info('Failed Route: ' + req.path() + ' (method not allowed)')
  res.send(405, {text: 'method not allowed'})
})

server.on('uncaughtException', (req, res, route, err) => {
  logger.error('Failed Route: ' + req.path() + '\n' + err.stack)
  res.send(500, {text: 'internal error'})
})

// Export the server for testing purposes
module.exports = server
