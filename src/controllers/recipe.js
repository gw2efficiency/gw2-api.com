const mongo = require('../helpers/mongo.js')
const {invalidParameters} = require('../helpers/controllers.js')

async function nested (request, response) {
  let id = parseInt(request.params.id, 10)

  if (!id) {
    return invalidParameters(response)
  }

  let recipe = await mongo.collection('recipe-trees').find({id: id}, {_id: 0}).limit(1).next()

  if (!recipe) {
    return response.send(404, {text: 'no such id'})
  }

  response.send(recipe)
}

module.exports = {nested}
