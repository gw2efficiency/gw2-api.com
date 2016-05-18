require('babel-polyfill')
const config = require('../config/application.js')

// If we are on the production environment, enable logging
if (config.keymetrics.logging) {
  require('pmx').init({http: true})
}

const restify = require('restify')
const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {setupRoutes, setupErrorHandling} = require('../helpers/server.js')
const routes = require('../config/routes.js')

// Connect to the database
mongo.connect()

// Setup a server and connect the routes
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())
server.use(restify.bodyParser())
setupRoutes(server, routes)
setupErrorHandling(server)
server.listen(config.server.port, () => logger.info('Server listening on port ' + config.server.port))

// Export the server for testing purposes
module.exports = server
