/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')

const routesSpy = sinon.spy()
const loggerStub = sinon.stub(require('../src/helpers/logger.js'))

const server = proxyquire('../src/server.js', {
  './helpers/sharedStorage.js': {
    load: () => {
    }, state: {}
  },
  './helpers/logger.js': loggerStub,
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
