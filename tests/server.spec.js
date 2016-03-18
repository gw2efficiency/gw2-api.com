/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')

const mongo = require('../src/helpers/mongo.js')
mongo.logger.quiet(true)

const routesSpy = sinon.spy()
const server = proxyquire('../src/server.js', {
  './routes.js': {setupRoutes: routesSpy, setupErrorHandling: routesSpy}
})

describe('server setup', () => {
  before(async () => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
  })

  it('can run the server', () => {
    expect(server).to.exist
    expect(server.name).to.equal('gw2-api.com')
  })

  it('initializes the routes', () => {
    expect(routesSpy.calledTwice).to.equal(true)
  })
})
