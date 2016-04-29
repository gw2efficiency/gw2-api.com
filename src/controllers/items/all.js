const mongo = require('../../helpers/mongo.js')
const {requestLanguage} = require('../../helpers/controllers.js')

async function all (request, response) {
  let lang = requestLanguage(request.params)

  let items = await mongo.collection('items')
    .find({tradable: true, lang: lang}, {_id: 0, lang: 0, valueIsVendor: 0})
    .toArray()

  response.send(items)
}

module.exports = all
