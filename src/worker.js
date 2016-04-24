require('babel-polyfill')
const mongo = require('./helpers/mongo.js')

// Connect to the database and start the scheduling
mongo.connect().then(() => {
  require('./workers/schedule.js')
})
