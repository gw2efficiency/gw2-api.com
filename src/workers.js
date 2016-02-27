const api = require('gw2api-client')
const sharedMemory = require('./sharedMemory.js')

// Load the shared memory and get working!
sharedMemory.read().then(function () {
  const ItemWorker = new (require('./workers/item.js'))(api, sharedMemory)
  const GemWorker = new (require('./workers/gem.js'))(api, sharedMemory)
  const SkinWorker = new (require('./workers/skin.js'))(api, sharedMemory)

  ItemWorker.initialize()
  GemWorker.initialize()
  SkinWorker.initialize()
})
