require('babel-polyfill')
const restify = require('restify')
const logger = require('./helpers/logger.js')
const sharedStorage = require('./helpers/sharedStorage.js')
const setupRoutes = require('./routes.js')

// Initially load the shared memory and set up loading it every
// minute to enable connecting our workers to the server
sharedStorage.load()
setInterval(sharedStorage.load, 60 * 1000)

// Setup a server and connect the routes
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())
setupRoutes(server)
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
