require('babel-polyfill')
const mongo = require('./helpers/mongo.js')
const itemWorker = require('./workers/item.js')
const gemWorker = require('./workers/gem.js')
const skinWorker = require('./workers/skin.js')
const recipeWorker = require('./workers/recipe.js')

// Connect to the DB and get working! :)
mongo.connect().then(() => {
  itemWorker.initialize()
  gemWorker.initialize()
  skinWorker.initialize()
  recipeWorker.initialize()
})
