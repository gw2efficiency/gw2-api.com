const mongo = require('../../helpers/mongo.js')
const config = require('../../config/application.js')

async function allValues (request, response) {
  let items = await mongo.collection('items').find(
    {lang: config.server.defaultLanguage, value: {'$ne': null}},
    {_id: 0, id: 1, value: 1}
  ).toArray()

  response.send(items)
}

module.exports = allValues
