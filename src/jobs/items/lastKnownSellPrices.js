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
  let page = 0
  let lastPage = 1

  // Go through all pages and find the first entry
  // where the price indicates that the item was in the tradingpost
  while (page <= lastPage) {
    let pageContent = await requester.single('http://www.gw2spidy.com/api/v0.9/json/listings/' + id + '/sell/' + page)
    lastPage = page.last_page
    let price = pageContent.results.find(c => c.quantity > 0)

    if (price) {
      return price.unit_price
    }

    page++
  }

  return false
}

module.exports = lastKnownSellPrices
