const restify = require('restify')
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

server.listen(8080)
