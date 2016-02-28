require('babel-polyfill')
const restify = require('restify')
const logger = require('./helpers/logger.js')
const sharedStorage = require('./helpers/sharedStorage.js')
const {setupRoutes, setupErrorHandling} = require('./routes.js')

// Initially load the shared memory and set up loading it every
// minute to enable connecting our worker to the server cluster
sharedStorage.load()
setInterval(sharedStorage.load, 60 * 1000)

// Setup a server and connect the routes
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())
setupRoutes(server)
setupErrorHandling(server)
server.listen(8080, () => logger.info('Server listening on port 8080'))

// Export the server for testing purposes
module.exports = server
