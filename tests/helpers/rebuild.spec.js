/* eslint-env node, mocha */
const proxyquire = require('proxyquire').noCallThru()
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const rebuild = proxyquire('../../src/helpers/rebuild.js', {
  mongo: mongo,
  '../jobs/items/itemList.js': () => false,
  '../jobs/items/itemPrices.js': () => false,
  '../jobs/items/itemValues.js': () => false,
  '../jobs/items/lastKnownSellPrices.js': () => false,
  '../jobs/recipes/recipeList.js': () => false,
  '../jobs/recipes/craftingPrices.js': () => false,
  '../jobs/skins/skinList.js': () => false,
  '../jobs/skins/skinPrices.js': () => false,
  '../jobs/gems/gemPriceHistory.js': () => false
})

describe('helpers > rebuild', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  it('can execute a full rebuild', async () => {
    await rebuild('full', () => false)
  })

  it('can execute a items rebuild', async () => {
    await rebuild('items', () => false)
  })

  it('can execute a skins rebuild', async () => {
    await rebuild('skins', () => false)
  })

  it('can execute a gems rebuild', async () => {
    await rebuild('gems', () => false)
  })
})
