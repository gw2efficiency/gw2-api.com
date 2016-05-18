const mongo = require('../../helpers/mongo.js')
const config = require('../../config/application.js')

async function allPrices (request, response) {
  let items = await mongo.collection('items').aggregate([
    {'$match': {tradable: true, lang: config.server.defaultLanguage}},
    {'$project': {_id: 0, id: 1, price: {'$max': ['$sell.price', '$buy.price', '$vendor_price']}}},
    {'$match': {price: {'$ne': null}}}
  ]).toArray()

  response.send(items)
}

module.exports = allPrices
