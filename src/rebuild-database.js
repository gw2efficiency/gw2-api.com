require('babel-polyfill')
const mongo = require('./helpers/mongo.js')
const chalk = require('chalk')
const itemWorker = require('./workers/item.js')
const gemWorker = require('./workers/gem.js')
const skinWorker = require('./workers/skin.js')
const recipeWorker = require('./workers/recipe.js')

// Connect to the DB and get working! :)
mongo.connect().then(async () => {
  try {
    await mongo.dropDatabase()
    console.log(chalk.black.bgGreen.bold('Cleared database'))

    await gemWorker.initialize()
    console.log(chalk.black.bgGreen.bold('Gem worker done'))

    await itemWorker.initialize()
    console.log(chalk.black.bgGreen.bold('Item worker done'))

    await skinWorker.initialize()
    console.log(chalk.black.bgGreen.bold('Skin worker done'))

    await recipeWorker.initialize()
    console.log(chalk.black.bgGreen.bold('Recipe worker done'))

    console.log(chalk.black.bgGreen.bold('Rebuild complete'))
    process.exit()
  } catch (e) {
    console.log(chalk.black.bgRed.bold('Error happened while rebuilding', e.stack))
    process.exit(1)
  }
})
