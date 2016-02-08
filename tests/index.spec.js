/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')
const restify = require('restify')

const client = restify.createJsonClient({
  url: 'http://127.0.0.1:8080',
  version: '*'
})

const gemWorker = {
  constructor: sinon.spy(),
  initialize: sinon.spy()
}

const loggerMock = {
  info: sinon.spy(),
  success: sinon.spy(),
  error: sinon.spy()
}

let gemControllerHandler = 0
const server = proxyquire('../src/index.js', {
  './controllers/gem.js': (api, client) => ({
    handle: (req, res) => {
      gemControllerHandler++
      res.send('mock response')
    }
  }),
  './workers/gem.js': (api, client) => {
    gemWorker.constructor(api, client)
    return gemWorker
  },
  './cache.js': {foo: 'bar'},
  './logger.js': loggerMock
})

describe('server', () => {
  beforeEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  it('can run the server', () => {
    expect(server).to.exist
    expect(server.name).to.equal('gw2-api.com')
  })

  it('initializes the workers correctly', () => {
    expect(gemWorker.constructor.called).to.equal(true)
    expect(gemWorker.constructor.args[0][0]).to.be.an.instanceOf(require('gw2api-client'))
    expect(gemWorker.constructor.args[0][1]).to.deep.equal({foo: 'bar'})
    expect(gemWorker.initialize.calledOnce).to.equal(true)
  })

  it('/gem/history gets called correctly', (done) => {
    client.get('/gems/history', err => {
      if (err) throw err
      expect(gemControllerHandler).to.equal(1)
      done()
    })
  })

  it('logs errors and returns the correct response for missing routes', (done) => {
    client.get('/this/is/a/nonexisting/route', (err, req, res) => {
      if (err) {
      }
      expect(loggerMock.info.calledOnce).to.equal(true)
      expect(loggerMock.info.args[0][0]).to.contain('/this/is/a/nonexisting/route')
      expect(loggerMock.info.args[0][0]).to.contain('Failed Route')
      expect(loggerMock.info.args[0][0]).to.contain('route not found')
      expect(res.statusCode).to.equal(404)
      expect(JSON.parse(res.body)).to.deep.equal({text: 'endpoint not found'})
      done()
    })
  })

  it('logs errors and returns the correct response for bad method calls', (done) => {
    client.post('/gems/history', (err, req, res) => {
      if (err) {
      }
      expect(loggerMock.info.calledOnce).to.equal(true)
      expect(loggerMock.info.args[0][0]).to.contain('/gems/history')
      expect(loggerMock.info.args[0][0]).to.contain('Failed Route')
      expect(loggerMock.info.args[0][0]).to.contain('method not allowed')
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
      expect(loggerMock.error.calledOnce).to.equal(true)
      expect(loggerMock.error.args[0][0]).to.contain('/failing/route')
      expect(loggerMock.error.args[0][0]).to.contain('Failed Route')
      expect(loggerMock.error.args[0][0]).to.contain('OH NO SOMETHING BAD :(')
      expect(res.statusCode).to.equal(500)
      expect(JSON.parse(res.body)).to.deep.equal({text: 'internal error'})
      done()
    })
  })
})
