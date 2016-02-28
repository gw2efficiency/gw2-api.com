/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const restify = require('restify')

const client = restify.createJsonClient({
  url: 'http://127.0.0.1:12345',
  version: '*'
})

const routes = rewire('../src/routes.js')

const loggerMock = {info: sinon.spy(), success: sinon.spy(), error: sinon.spy()}
routes.__set__('logger', loggerMock)

// gem controller overwrite
routes.__set__('gem', {
  history: (req, res) => res.send('GemController.history')
})

// item controller overwrite
routes.__set__('item', {
  byId: (req, res) => res.send('ItemController.byId'),
  byIds: (req, res) => res.send('ItemController.byIds'),
  all: (req, res) => res.send('ItemController.all'),
  allPrices: (req, res) => res.send('ItemController.allPrices'),
  autocomplete: (req, res) => res.send('ItemController.autocomplete'),
  byName: (req, res) => res.send('ItemController.byName'),
  bySkin: (req, res) => res.send('ItemController.bySkin'),
  categories: (req, res) => res.send('ItemController.categories'),
  query: (req, res) => res.send('ItemController.query')
})

// skin controller overwrite
routes.__set__('skin', {
  resolve: (req, res) => res.send('SkinController.resolve')
})

// Start a mock server and test the routing on that
const server = restify.createServer()
server.listen(12345, () => {
  beforeEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  routes.setupRoutes(server)
  routes.setupErrorHandling(server)

  describe('routes > setup routes', () => {
    it('/ gets called correctly', (done) => {
      client.get('/', (err, req, res) => {
        if (err) throw err
        expect(res.statusCode).to.equal(302)
        expect(res.headers.location).to.contain('github')
        done()
      })
    })

    it('/item gets called correctly', (done) => {
      client.get('/item', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.byId')
        done()
      })
    })

    it('/item/:id gets called correctly', (done) => {
      client.get('/item/123', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.byId')
        done()
      })
    })

    it('/items gets called correctly', (done) => {
      client.get('/items', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.byIds')
        done()
      })
    })

    it('/items/:ids gets called correctly', (done) => {
      client.get('/items/123,456', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.byIds')
        done()
      })
    })

    it('/items/all gets called correctly', (done) => {
      client.get('/items/all', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.all')
        done()
      })
    })

    it('/items/all-prices gets called correctly', (done) => {
      client.get('/items/all-prices', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.allPrices')
        done()
      })
    })

    it('/items/autocomplete gets called correctly', (done) => {
      client.get('/items/autocomplete', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.autocomplete')
        done()
      })
    })

    it('/items/by-name gets called correctly', (done) => {
      client.get('/items/by-name', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.byName')
        done()
      })
    })

    it('/items/by-skin gets called correctly', (done) => {
      client.get('/items/by-skin', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.bySkin')
        done()
      })
    })

    it('/items/categories gets called correctly', (done) => {
      client.get('/items/categories', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.categories')
        done()
      })
    })

    it('/items/query gets called correctly', (done) => {
      client.get('/items/query', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.query')
        done()
      })
    })

    it('/skins/resolve gets called correctly', (done) => {
      client.get('/skins/resolve', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('SkinController.resolve')
        done()
      })
    })

    it('/gem/history gets called correctly', (done) => {
      client.get('/gems/history', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('GemController.history')
        done()
      })
    })

    it('binds controllers correctly to routes', () => {
      let wrap = routes.__get__('wrapRequest')

      function someMethod (req, res) {
        res.send({text: 'Some'})
      }

      let boundController = wrap(someMethod)
      expect(boundController).to.be.a.function

      let res = {cache: sinon.spy(), charSet: sinon.spy(), send: sinon.spy()}
      let next = sinon.spy()
      boundController({path: () => ''}, res, next)

      expect(res.cache.calledOnce).to.equal(true)
      expect(res.charSet.calledOnce).to.equal(true)
      expect(res.sendParent.calledOnce).to.equal(true)
      expect(next.calledOnce).to.equal(true)
      expect(res.sendParent.args[0][0]).to.deep.equal({text: 'Some'})
    })
  })

  describe('routes > setup error handling', () => {
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
      server.get('/gems/history', () => {
        console.log('Some fake route.')
      })

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
})
