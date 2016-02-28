/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')
const restify = require('restify')

const client = restify.createJsonClient({
  url: 'http://127.0.0.1:8080',
  version: '*'
})

const routesSpy = sinon.spy()
const loggerStub = sinon.stub(require('../src/helpers/logger.js'))

const server = proxyquire('../src/server.js', {
  './helpers/sharedStorage.js': {
    load: () => {
    }, state: {}
  },
  './helpers/logger.js': loggerStub,
  './routes.js': routesSpy
})

describe('server', () => {
  beforeEach(() => {
    loggerStub.info.reset()
    loggerStub.success.reset()
    loggerStub.error.reset()
  })

  it('can run the server', () => {
    expect(server).to.exist
    expect(server.name).to.equal('gw2-api.com')
  })

  it('initializes the routes', () => {
    expect(routesSpy.calledOnce).to.equal(true)
  })

  it('logs errors and returns the correct response for missing routes', (done) => {
    client.get('/this/is/a/nonexisting/route', (err, req, res) => {
      if (err) {
      }
      expect(loggerStub.info.calledOnce).to.equal(true)
      expect(loggerStub.info.args[0][0]).to.contain('/this/is/a/nonexisting/route')
      expect(loggerStub.info.args[0][0]).to.contain('Failed Route')
      expect(loggerStub.info.args[0][0]).to.contain('route not found')
      expect(res.statusCode).to.equal(404)
      expect(JSON.parse(res.body)).to.deep.equal({text: 'endpoint not found'})
      done()
    })
  })

  it('logs errors and returns the correct response for bad method calls', (done) => {
    server.get('/gems/history', () => {
      console.log('Some fake route.')
    })

    client.post('/gems/history', (err, req, res) => {
      if (err) {
      }
      expect(loggerStub.info.calledOnce).to.equal(true)
      expect(loggerStub.info.args[0][0]).to.contain('/gems/history')
      expect(loggerStub.info.args[0][0]).to.contain('Failed Route')
      expect(loggerStub.info.args[0][0]).to.contain('method not allowed')
      expect(res.statusCode).to.equal(405)
      expect(JSON.parse(res.body)).to.deep.equal({text: 'method not allowed'})
      done()
    })
  })

  it('logs errors and returns the correct response for internal server errors', (done) => {
    server.get('/failing/route', () => {
      let err = new Error('some message')
      err.stack = 'OH NO SOMETHING BAD :('
      throw err
    })

    client.get('/failing/route', (err, req, res) => {
      if (err) {
      }
      expect(loggerStub.error.calledOnce).to.equal(true)
      expect(loggerStub.error.args[0][0]).to.contain('/failing/route')
      expect(loggerStub.error.args[0][0]).to.contain('Failed Route')
      expect(loggerStub.error.args[0][0]).to.contain('OH NO SOMETHING BAD :(')
      expect(res.statusCode).to.equal(500)
      expect(JSON.parse(res.body)).to.deep.equal({text: 'internal error'})
      done()
    })
  })
})
