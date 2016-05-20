const mongo = require('../../helpers/mongo.js')
const {multiParameter} = require('../../helpers/controllers.js')

async function nested (request, response) {
  let ids = multiParameter(request.params.ids, true)

  let recipes = await mongo.collection('recipe-trees')
    .find({id: {$in: ids}}, {_id: 0})
    .toArray()

  response.send(recipes)
}

module.exports = nested
