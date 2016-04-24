const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const async = require('gw2e-async-promises')
const transformItem = require('./_transformItem.js')

const languages = ['en', 'de', 'fr', 'es']

async function itemList () {
  let itemRequests = languages.map(lang => () => api().language(lang).items().all())
  let items = await async.parallel(itemRequests)

  // We save one row per item per language. This *does* take longer in
  // the worker, but it enables the server part to serve requests using nearly
  // no processing power, since it doesn't have to transform languages to
  // match the request. We could move the transforming to the mongodb server
  // using aggregates, but that's also processing for every request instead of a
  // little overhead when adding new items.
  let collection = mongo.collection('items')
  let updateFunctions = []

  for (let key in languages) {
    let lang = languages[key]
    let languageItems = items[key]
    languageItems.map(item => {
      item = {...transformItem(item), lang: lang}
      updateFunctions.push(() =>
        collection.update({id: item.id, lang: lang}, {'$set': item}, {upsert: true})
      )
    })
  }

  await async.parallel(updateFunctions)
}

module.exports = itemList
