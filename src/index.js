const restify = require('restify')
const logger = require('./logger.js')
const api = require('gw2api-client')
const cache = require('./cache.js')
const setupRoutes = require('./routes.js')

// Load cache and set up background saving
cache.load()
let forceInitialLoad = Object.keys(cache.state).length === 0
setInterval(cache.save, 10 * 60 * 1000)

// Setup the background workers
const ItemWorker = new (require('./workers/item.js'))(api, cache.state)
const GemWorker = new (require('./workers/gem.js'))(api, cache.state)
ItemWorker.initialize(forceInitialLoad)
GemWorker.initialize(forceInitialLoad)

// Setup the controller and routes
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())
setupRoutes(server, cache.state)
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
