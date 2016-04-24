const mongo = require('../../helpers/mongo.js')
const requester = require('gw2e-requester')

// Find all entries in the database where the last sell price is not known
// and search through gw2spidy to see if they have any old prices for it
async function lastKnownSellPrices () {
  let items = await mongo.collection('items').find(
    {lang: 'en', 'tradable': true, 'sell.quantity': 0, 'sell.last_known': false},
    {_id: 0, id: 1, name: 1}
  ).toArray()

  for (var i in items) {
    let item = items[i]
    let price = await loadPrice(item.id)
    await mongo.collection('items').update(
      {id: item.id},
      {$set: {'sell.last_known': price}},
      {multi: true}
    )
  }
}

async function loadPrice (id) {
  let page = await requester.single('http://www.gw2spidy.com/api/v0.9/json/listings/' + id + '/sell/1')
  page = page.last_page

  // Go through all pages in reverse, and find the first entry
  // where the price indicates, that the item was in the tradingpost
  while (page > 0) {
    let pageContent = await requester.single('http://www.gw2spidy.com/api/v0.9/json/listings/' + id + '/sell/' + page)
    pageContent = pageContent.results.reverse()
    let price = pageContent.find(c => c.unit_price > 0)

    if (price) {
      return price.unit_price
    }

    page--
  }

  return false
}

module.exports = lastKnownSellPrices
