require('babel-polyfill')
const mongo = require('./helpers/mongo.js')
const chalk = require('chalk')
const requester = require('gw2e-requester')
const itemWorker = require('./workers/item.js')
const gemWorker = require('./workers/gem.js')
const skinWorker = require('./workers/skin.js')
const recipeWorker = require('./workers/recipe.js')

function log (string, error = false) {
  let formatting = error ? chalk.red.bold : chalk.green.bold
  console.log(formatting('\n-'.repeat(string.length + 4)))
  console.log(formatting('| ' + string.toUpperCase() + ' |'))
  console.log(formatting('-'.repeat(string.length + 4) + '\n'))
}

// Connect to the DB and get working! :)
mongo.connect().then(async () => {
  // Find all entries in the database where the last sell price is not known
  // and search through gw2spidy to see if they have any old prices for it
  async function loadLastKnownSellPrices () {
    let items = await mongo.collection('items').find(
      {lang: 'en', 'tradable': true, 'sell.quantity': 0, 'sell.last_known': false},
      {_id: 0, id: 1, name: 1}
    ).toArray()

    for (var i in items) {
      let item = items[i]
      let price = await loadLastKnownSellPrice(item.id)
      console.log('Price for "' + item.name + '" (' + item.id + '): ', price)
      await mongo.collection('items').update(
        {id: item.id},
        {$set: {'sell.last_known': price}},
        {multi: true}
      )
    }
  }

  async function loadLastKnownSellPrice (id) {
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

  try {
    await mongo.dropDatabase()
    log('Cleared database')

    await gemWorker.initialize()
    log('Gem worker done')

    await itemWorker.initialize()
    log('Item worker done')

    await loadLastKnownSellPrices()
    log('Importing old last known prices done')

    await skinWorker.initialize()
    log('Skin worker done')

    await recipeWorker.initialize()
    log('Recipe worker done')

    log('Rebuild complete')
    process.exit()
  } catch (e) {
    log('Error happened while rebuilding:\n' + e.stack, true)
    process.exit(1)
  }
})
