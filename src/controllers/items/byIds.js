const mongo = require('../../helpers/mongo.js')
const {requestLanguage, multiParameter} = require('../../helpers/controllers.js')

async function byIds (request, response) {
  let lang = requestLanguage(request.params)
  let ids = multiParameter(request.params.ids, true)

  let items = await mongo.collection('items')
    .find({id: {$in: ids}, lang: lang}, {_id: 0, lang: 0, valueIsVendor: 0})
    .toArray()

  response.send(items)
}

module.exports = byIds
