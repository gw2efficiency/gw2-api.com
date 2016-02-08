const restify = require('restify')
const logger = require('./logger.js')
const api = new (require('gw2api-client'))()
const sharedCache = require('./cache.js')

// Setup the background workers
const GemWorker = require('./workers/gem.js')(api, sharedCache)
GemWorker.initialize()

// Setup the controllers
const GemController = require('./controllers/gem.js')(sharedCache)

// Set up the server
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())

server.get('/gems/history', (req, res, next) => GemController.handle(req, res, next))

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
