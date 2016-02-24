const AbstractController = require('../controller.js')

class SkinController extends AbstractController {
  resolve (request, response) {
    response.send(this.cache.skinsToItems)
  }
}

module.exports = SkinController
