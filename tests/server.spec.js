/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')

const routesSpy = sinon.spy()
const server = proxyquire('../src/server.js', {
  './helpers/sharedStorage.js': {load: () => true},
  './helpers/logger.js': sinon.stub(require('../src/helpers/logger.js')),
  './routes.js': {setupRoutes: routesSpy, setupErrorHandling: routesSpy}
})

describe('server', () => {
  it('can run the server', () => {
    expect(server).to.exist
    expect(server.name).to.equal('gw2-api.com')
  })

  it('initializes the routes', () => {
    expect(routesSpy.calledTwice).to.equal(true)
  })
})
