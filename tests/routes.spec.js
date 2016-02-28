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

// GemController overwrite
routes.__set__('gem', {
  history: (req, res) => res.send('GemController.history')
})

// ItemController overwrite
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

// SkinController overwrite
routes.__set__('skin', {
  resolve: (req, res) => res.send('SkinController.resolve')
})

// Start a mock server and test the routing on that
const server = restify.createServer()
server.listen(12345, () => {
  routes(server, 'cache')

  describe('routing', () => {
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
})
