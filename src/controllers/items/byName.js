const mongo = require('../../helpers/mongo.js')
const {invalidParameters, requestLanguage, multiParameter} = require('../../helpers/controllers.js')

async function byName (request, response) {
  let lang = requestLanguage(request.params)

  if (!request.params.names) {
    return invalidParameters(response)
  }

  let names = multiParameter(request.params.names)

  let items = await mongo.collection('items')
    .find({name: {$in: names}, lang: lang}, {_id: 0, lang: 0, valueIsVendor: 0})
    .toArray()

  response.send(items)
}

module.exports = byName
