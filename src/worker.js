require('babel-polyfill')
const storage = require('./helpers/sharedStorage.js')
const itemWorker = require('./workers/item.js')
const gemWorker = require('./workers/gem.js')
const skinWorker = require('./workers/skin.js')
const recipeWorker = require('./workers/recipe.js')

// Load the current data and get working! :)
storage.load().then(() => {
  itemWorker.initialize()
  gemWorker.initialize()
  skinWorker.initialize()
  recipeWorker.initialize()
})
