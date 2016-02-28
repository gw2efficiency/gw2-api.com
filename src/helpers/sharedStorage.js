const logger = require('./logger.js')
const redis = require('redis').createClient()
const cacheKey = 'gw2api-shared-storage'

let onError = (err) => logger.error('Redis error: ' + err.message)
redis.on('error', onError)

let state = {}

function load () {
  return new Promise(resolve => {
    redis.get(cacheKey, (err, result) => {
      if (err) {
        logger.error('Error loading shared memory from redis: ', err)
        return resolve()
      }

      if (!result) {
        logger.info('No shared memory existing')
        return resolve()
      }

      try {
        state = JSON.parse(result)
      } catch (e) {
        logger.error('Error loading shared memory from redis: Failed parsing JSON')
        return resolve()
      }

      logger.info('Loaded shared memory from redis')
      return resolve()
    })
  })
}

function save () {
  redis.set(cacheKey, JSON.stringify(state), () => {
    logger.info('Saved shared memory to redis')
  })
}

function get (key, fallback = undefined) {
  return state[key] || fallback
}

function set (key, value) {
  state[key] = value
}

module.exports = {load, save, get, set}
