// In this file, all jobs are getting registered with their names,
// path, titles and scheduling information for all processes

const jobs = [
  {
    name: 'item-list',
    path: '../jobs/items/itemList.js',
    data: {title: 'Update the list of items'},
    priority: 'medium',
    ttl: 10 * 60 * 1000,
    attempts: 3,
    schedule: '0 0 2 * * *'
  },
  {
    name: 'item-prices',
    path: '../jobs/items/itemPrices.js',
    data: {title: 'Update the item prices'},
    priority: 'high',
    ttl: 5 * 60 * 1000,
    schedule: '0 */5 * * * *'
  },
  {
    name: 'item-values',
    path: '../jobs/items/itemValues.js',
    data: {title: 'Calculate the item values'},
    priority: 'high',
    ttl: 5 * 60 * 1000,
    schedule: '0 */5 * * * *'
  },
  {
    name: 'recipe-list',
    path: '../jobs/recipes/recipeList.js',
    data: {title: 'Update the list of recipes'},
    priority: 'medium',
    ttl: 10 * 60 * 1000,
    attempts: 3,
    schedule: '0 0 4 * * *'
  },
  {
    name: 'crafting-prices',
    path: '../jobs/recipes/craftingPrices.js',
    data: {title: 'Calculate the crafting prices'},
    priority: 'high',
    ttl: 5 * 60 * 1000,
    schedule: '0 */5 * * * *'
  },
  {
    name: 'skin-list',
    path: '../jobs/skins/skinList.js',
    data: {title: 'Update the list of skins'},
    priority: 'medium',
    ttl: 10 * 60 * 1000,
    attempts: 3,
    schedule: '0 0 3 * * *'
  },
  {
    name: 'skin-prices',
    path: '../jobs/skins/skinPrices.js',
    data: {title: 'Calculate the skin prices'},
    priority: 'high',
    ttl: 5 * 60 * 1000,
    schedule: '0 */5 * * * *'
  },
  {
    name: 'gem-price-history',
    path: '../jobs/gems/gemPriceHistory.js',
    data: {title: 'Update the gem prices'},
    priority: 'medium',
    ttl: 5 * 60 * 1000,
    attempts: 3,
    schedule: '* */30 * * * *'
  },
  {
    name: 'item-last-known-prices',
    path: '../jobs/items/lastKnownPrices.js',
    data: {title: 'Load the missing last known sell prices'},
    priority: 'medium',
    ttl: 30 * 60 * 1000,
    attempts: 3,
    schedule: '0 0 5 * * *'
  }
]

module.exports = jobs
