const mongodb = require('mongodb').MongoClient
const logger = require('./logger.js')

const url = 'mongodb://localhost:27017/gw2api'
let database

function connect () {
  return new Promise((resolve, reject) => {
    mongodb.connect(url, (err, db) => {
      if (err) {
        logger.error('Failed connecting to mongodb: ', err.message)
        return reject(err)
      }

      database = db
      logger.info('Connection established to ' + url)
      db.on('close', () => logger.error('Connection to mongodb closed'))
      db.on('reconnect', () => logger.info('Connection to mongodb reestablished'))

      resolve()
    })
  })
}

function collection (name) {
  return database.collection(name)
}

module.exports = {connect, collection}
