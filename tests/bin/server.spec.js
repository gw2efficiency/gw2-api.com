/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')

const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const routesSpy = sinon.spy()
const server = proxyquire('../../src/bin/server.js', {
  '../helpers/server.js': {setupRoutes: routesSpy, setupErrorHandling: routesSpy}
})

describe('bin > server', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  it('can run the server', () => {
    expect(server).to.exist
    expect(server.name).to.equal('gw2-api.com')
  })

  it('initializes the routes', () => {
    expect(routesSpy.calledTwice).to.equal(true)
  })

  it('starts logging if the config is set', () => {
    let config = {server: {port: 8080}, keymetrics: {logging: true}}

    let logSpy = sinon.spy()
    proxyquire('../../src/bin/server.js', {
      pmx: {init: logSpy},
      '../config/application.js': config
    })

    expect(logSpy.called).to.equal(true)
  })
})
