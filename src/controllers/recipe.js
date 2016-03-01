const storage = require('../helpers/sharedStorage.js')
const {invalidParameters} = require('../helpers/controllers.js')

function nested (request, response) {
  let id = parseInt(request.params.id, 10)

  if (!id) {
    return invalidParameters(response)
  }

  let content = storage.get('recipeTrees').find(x => x.id === id)

  response.send(content)
}

module.exports = {nested}
