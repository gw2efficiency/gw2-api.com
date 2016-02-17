/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')
const restify = require('restify')

const client = restify.createJsonClient({
  url: 'http://127.0.0.1:8080',
  version: '*'
})

const itemWorker = {
  constructor: sinon.spy(),
  initialize: sinon.spy()
}

const gemWorker = {
  constructor: sinon.spy(),
  initialize: sinon.spy()
}

const loggerMock = {
  info: sinon.spy(),
  success: sinon.spy(),
  error: sinon.spy()
}

let itemControllerHandlerCalls = 0
let gemControllerHandlerCalls = 0

const server = proxyquire('../src/index.js', {
  './cache.js': {foo: 'bar'},
  './logger.js': loggerMock,
  './workers/item.js': (api, client) => {
    itemWorker.constructor(api, client)
    return itemWorker
  },
  './workers/gem.js': (api, client) => {
    gemWorker.constructor(api, client)
    return gemWorker
  },
  './controllers/item.js': (api, client) => ({
    handle: (req, res) => {
      itemControllerHandlerCalls++
      res.send('mock response')
    }
  }),
  './controllers/gem.js': (api, client) => ({
    handle: (req, res) => {
      gemControllerHandlerCalls++
      res.send('mock response')
    }
  })
})

describe('server', () => {
  beforeEach(() => {
    itemControllerHandlerCalls = 0
    gemControllerHandlerCalls = 0
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  it('can run the server', () => {
    expect(server).to.exist
    expect(server.name).to.equal('gw2-api.com')
  })

  it('initializes the item worker correctly', () => {
    expect(itemWorker.constructor.called).to.equal(true)
    expect(itemWorker.constructor.args[0][0]()).to.deep.equal(require('gw2api-client')())
    expect(itemWorker.constructor.args[0][1]).to.deep.equal({foo: 'bar'})
    expect(itemWorker.initialize.calledOnce).to.equal(true)
  })

  it('initializes the gem worker correctly', () => {
    expect(gemWorker.constructor.called).to.equal(true)
    expect(gemWorker.constructor.args[0][0]()).to.deep.equal(require('gw2api-client')())
    expect(gemWorker.constructor.args[0][1]).to.deep.equal({foo: 'bar'})
    expect(gemWorker.initialize.calledOnce).to.equal(true)
  })

  it('/ gets called correctly', (done) => {
    client.get('/', (err, req, res) => {
      if (err) throw err
      expect(res.statusCode).to.equal(302)
      expect(res.headers.location).to.contain('github')
      done()
    })
  })

  it('/item gets called correctly', (done) => {
    client.get('/item', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/item/:id gets called correctly', (done) => {
    client.get('/item/123', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items gets called correctly', (done) => {
    client.get('/items', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/:ids gets called correctly', (done) => {
    client.get('/items/123,456', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/all gets called correctly', (done) => {
    client.get('/items/all', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/all-prices gets called correctly', (done) => {
    client.get('/items/all-prices', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/autocomplete gets called correctly', (done) => {
    client.get('/items/autocomplete', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/by-name gets called correctly', (done) => {
    client.get('/items/by-name', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/by-skin gets called correctly', (done) => {
    client.get('/items/by-skin', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/query gets called correctly', (done) => {
    client.get('/items/query', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/items/categories gets called correctly', (done) => {
    client.get('/items/categories', (err, req, res) => {
      if (err) throw err
      expect(itemControllerHandlerCalls).to.equal(1)
      done()
    })
  })

  it('/gem/history gets called correctly', (done) => {
    client.get('/gems/history', err => {
      if (err) throw err
      expect(gemControllerHandlerCalls).to.equal(1)
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
