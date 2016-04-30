const client = require('gw2e-gw2api-client')

// Retry for a max of 5 times if it's not a valid status
function retry (tries, err) {
  if (tries > 5) {
    return false
  }

  if (err.response && [200, 403].indexOf(err.response.status) !== -1) {
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
