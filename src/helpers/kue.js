const kue = require('kue')
const config = require('../config/application.js')

const createQueue = kue.createQueue

kue.createQueue = () => createQueue({
  prefix: config.kue.prefix,
  redis: config.redis
})

module.exports = kue
