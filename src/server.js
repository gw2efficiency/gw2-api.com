require('babel-polyfill')

// TODO use env variables somehow
// require('pmx').init({http: true})
// require('newrelic')

const restify = require('restify')
const logger = require('./helpers/logger.js')
const mongo = require('./helpers/mongo.js')
const {setupRoutes, setupErrorHandling} = require('./routes.js')

// Connect to the database
mongo.connect()

// Setup a server and connect the routes
const server = restify.createServer({name: 'gw2-api.com'})
server.use(restify.queryParser())
server.use(restify.bodyParser())
setupRoutes(server)
setupErrorHandling(server)
server.listen(8080, () => logger.info('Server listening on port 8080'))

// Export the server for testing purposes
module.exports = server
