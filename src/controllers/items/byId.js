const mongo = require('../../helpers/mongo.js')
const {invalidParameters, requestLanguage} = require('../../helpers/controllers.js')

async function byId (request, response) {
  let lang = requestLanguage(request.params)
  let id = parseInt(request.params.id, 10)

  if (!id) {
    return invalidParameters(response)
  }

  let item = await mongo.collection('items')
    .find({id: id, lang: lang}, {_id: 0, lang: 0, valueIsVendor: 0})
    .limit(1).next()

  if (!item) {
    return response.send(404, {text: 'no such id'})
  }

  response.send(item)
}

module.exports = byId
