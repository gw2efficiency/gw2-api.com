const mongo = require('../../helpers/mongo.js')

async function allValues (request, response) {
  let items = await mongo.collection('items').find(
    {lang: 'en', value: {'$ne': null}},
    {_id: 0, id: 1, value: 1}
  ).toArray()

  response.send(items)
}

module.exports = allValues
