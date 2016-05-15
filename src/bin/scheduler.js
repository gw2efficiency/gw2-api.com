// This process just handles the scheduling of background jobs.
// It pushes the tasks into a priority queue to be picked up by the worker processes.

const createJob = require('../helpers/createJob.js')

createJob({
  name: 'item-list',
  data: {title: 'Update the list of items'},
  priority: 'medium',
  ttl: 10 * 60 * 1000,
  attempts: 3,
  schedule: '0 0 2 * * *'
})

createJob({
  name: 'item-prices',
  data: {title: 'Update the item prices'},
  priority: 'high',
  ttl: 5 * 60 * 1000,
  schedule: '0 */5 * * * *'
})

createJob({
  name: 'item-values',
  data: {title: 'Calculate the item values'},
  priority: 'high',
  ttl: 5 * 60 * 1000,
  schedule: '0 */5 * * * *'
})

createJob({
  name: 'recipe-list',
  data: {title: 'Update the list of recipes'},
  priority: 'medium',
  ttl: 10 * 60 * 1000,
  attempts: 3,
  schedule: '0 0 4 * * *'
})

createJob({
  name: 'crafting-prices',
  data: {title: 'Calculate the crafting prices'},
  priority: 'high',
  ttl: 5 * 60 * 1000,
  schedule: '0 */5 * * * *'
})

createJob({
  name: 'skin-list',
  data: {title: 'Update the list of skins'},
  priority: 'medium',
  ttl: 10 * 60 * 1000,
  attempts: 3,
  schedule: '0 0 3 * * *'
})

createJob({
  name: 'skin-prices',
  data: {title: 'Calculate the skin prices'},
  priority: 'high',
  ttl: 5 * 60 * 1000,
  schedule: '0 */5 * * * *'
})

createJob({
  name: 'gem-price-history',
  data: {title: 'Update the gem prices'},
  priority: 'medium',
  ttl: 5 * 60 * 1000,
  attempts: 3,
  schedule: '* */30 * * * *'
})
