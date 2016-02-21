const AbstractController = require('../controller.js')

class GemController extends AbstractController {
  history (request, response) {
    response.send(this.cache.gemPriceHistory)
  }
}

module.exports = GemController
