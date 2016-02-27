const logger = require('./logger.js')
const redis = require('redis').createClient()
const cacheKey = 'gw2api-shared-memory'

redis.on('error', (err) => {
  logger.error('Redis error: ', err)
})

let sharedStorage = {
  read: () => {
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
          result = JSON.parse(result)
        } catch (e) {
          logger.error('Error loading shared memory from redis: Failed parsing JSON')
          return resolve()
        }

        // We can't replace the state object itself, because we
        // would loose the reference, so instead go through all keys
        for (var key in result) {
          sharedStorage.state[key] = result[key]
        }

        logger.success('Loaded shared memory from redis')
        return resolve()
      })
    })
  },
  write: () => {
    redis.set(cacheKey, JSON.stringify(sharedStorage.state), () => {
      logger.success('Saved shared memory to redis')
    })
  },
  state: {}
}

module.exports = sharedStorage
