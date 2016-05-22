const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const async = require('gw2e-async-promises')
const transformItem = require('./_transformItem.js')
const config = require('../../config/application.js')
const languages = config.server.languages

async function itemList (job, done) {
  job.log(`Starting job`)

  let itemRequests = languages.map(lang => () => api().language(lang).items().all())
  let items = await async.parallel(itemRequests)
  job.log(`Fetched ${items[0].length} items in ${languages.length} languages`)

  // Transform the API items into the structure we expect
  languages.map((lang, i) => {
    items[i] = items[i].map(item => ({...transformItem(item), lang: lang}))
  })
  items = items.reduce((x, y) => x.concat(y), [])
  job.log(`Transformed ${items.length} items`)

  // We save one row per item per language. This *does* take longer in
  // the worker, but it enables the server part to serve requests using nearly
  // no processing power, since it doesn't have to transform languages to
  // match the request. We could move the transforming to the mongodb server
  // using aggregates, but that's also processing for every request instead of a
  // little overhead when adding new items.
  let collection = mongo.collection('items')
  let updateFunctions = items.map(item =>
    () => collection.updateOne({id: item.id, lang: item.lang}, {$set: item}, {upsert: true})
  )
  job.log(`Created update functions`)

  await async.parallel(updateFunctions, config.mongo.parallelWriteLimit)
  job.log(`Updated items`)
  done()
}

module.exports = itemList
