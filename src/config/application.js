// This is the file that the application loads, which then in turn
// loads the environment configuration for the specific NODE_ENV

const path = process.env.NODE_ENV === 'production'
  ? '../config/environment.production.js'
  : '../config/environment.js'

const configuration = require(path)

module.exports = configuration
