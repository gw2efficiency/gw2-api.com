require('babel-polyfill')
const mongo = require('../helpers/mongo.js')
const schedule = require('../helpers/worker.js')
const scheduledTasks = require('../config/schedule.js')

// Connect to the database and start the scheduling
mongo.connect().then(() => {
  scheduledTasks.map(task => schedule(task[0], task[1]))
})
