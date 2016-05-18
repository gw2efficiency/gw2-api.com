const logger = require('./logger.js')

function setupRoutes (server, routes) {
  server.get('/', (req, res, next) => res.redirect('https://github.com/gw2efficiency/gw2-api.com/', next))

  for (let url in routes) {
    let callback = routes[url]
    server.get(url, wrapRequest(callback))
    server.post(url, wrapRequest(callback))
  }
}

// Wrap a request to offer a easier to use interface
function wrapRequest (callback) {
  return (request, response, next) => {
    // Set the default response settings
    response.cache('public', {maxAge: 5 * 60})
    setDefaultResponseHeaders(response)

    // Overwrite the send function so it automatically triggers "next"
    response.sendParent = response.send
    response.send = (status, body) => {
      response.sendParent(status, body)
      next()
    }

    // Call our controller function with the request and new response object
    let call = callback(request, response)

    // If the call is a promise, we want to catch errors on it since
    // the restify error handling doesn't do that automatically
    if (call instanceof Promise === false) return
    call.catch(err => handleUncaughtException(request, response, null, err))
  }
}

function setDefaultResponseHeaders (response) {
  response.charSet('utf-8')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
}

function setupErrorHandling (server) {
  server.on('NotFound', (req, res) => {
    logger.info('Failed Route: ' + req.path() + ' (route not found)')
    setDefaultResponseHeaders(res)
    res.send(404, {text: 'endpoint not found'})
  })

  server.on('MethodNotAllowed', (req, res) => {
    logger.info('Failed Route: ' + req.path() + ' (method not allowed)')
    setDefaultResponseHeaders(res)
    res.send(405, {text: 'method not allowed'})
  })

  server.on('uncaughtException', handleUncaughtException)
}

function handleUncaughtException (req, res, route, err) {
  logger.error('Failed Route: ' + req.path() + '\n' + err.stack)
  setDefaultResponseHeaders(res)
  res.send(500, {text: 'internal error'})
}

module.exports = {setupRoutes, setupErrorHandling}
