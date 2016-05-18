const client = require('gw2e-gw2api-client')
const config = require('../config/application.js')

// Retry for a max of 5 times if it's not a valid status
function retry (tries, err) {
  if (tries > config.gw2api.retries) {
    return false
  }

  if (err.response && (err.response.status < 400 || err.response.status === 403)) {
    return false
  }

  return true
}

// Specify the retry wait time
let retryWait = tries => tries * 100

module.exports = () => {
  let api = client()
  api.requester.retry(retry)
  api.requester.retryWait(retryWait)
  return api
}
