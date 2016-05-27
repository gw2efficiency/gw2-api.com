const mongo = require('../../helpers/mongo.js')
const {requestLanguage} = require('../../helpers/controllers.js')

const pageSize = 100

async function byCraftingProfit (request, response) {
  let lang = requestLanguage(request.params)
  let page = request.params.page || 0

  let totalResults = await mongo.collection('items')
    .find({craftable: true, lang: lang}, {_id: 0, lang: 0, valueIsVendor: 0})
    .count()

  let items = await mongo.collection('items')
    .find({craftable: true, lang: lang}, {_id: 0, lang: 0, valueIsVendor: 0})
    .sort({craftingProfit: -1})
    .skip(pageSize * page)
    .limit(pageSize)
    .toArray()

  response.send({
    totalResults: totalResults,
    results: items
  })
}

module.exports = byCraftingProfit
