const environment = {
  server: {
    // port of the api server
    port: 8080,
    // languages to support and the default language (needs to be in the languages)
    languages: ['de', 'en', 'fr', 'es'],
    defaultLanguage: 'en'
  },
  kue: {
    // port, username and password of the job monitoring server
    port: 4000,
    username: 'username',
    password: 'password',
    // redis prefix for queued jobs
    prefix: 'kue-'
  },
  mongo: {
    // mongodb connection url
    url: 'mongodb://127.0.0.1:27017/gw2api',
    // parallel write limit, between 50 and 500 is the most efficient
    // "false" to disable any write limits (NOT ENCOURAGED)
    parallelWriteLimit: 100
  },
  redis: {
    // redis connection settings, you can see all options here:
    // https://github.com/NodeRedis/node_redis#options-object-properties
    port: 6379,
    host: '127.0.0.1'
  },
  keymetrics: {
    // enable/disable logging http requests to http://keymetrics.io
    logging: false
  },
  gw2api: {
    // retries for failed api requests (to the official api)
    retries: 5
  }
}

module.exports = environment
