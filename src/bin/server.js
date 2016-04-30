require('babel-polyfill')

// If we are on the production environment, enable logging
if (process.env.ENVIRONMENT === 'production') {
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
server.listen(8080, () => logger.info('Server listening on port 8080'))

// Export the server for testing purposes
module.exports = server
