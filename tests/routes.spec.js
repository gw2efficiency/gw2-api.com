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
const GemController = {
  handle: (req, res) => {
    res.send('GemController.handle')
  }
}
routes.__set__('GemController', () => GemController)

// ItemController overwrite
const ItemController = {
  handle: (req, res) => {
    res.send('ItemController.handle')
  }
}
routes.__set__('ItemController', () => ItemController)

// Start a mock server and test the routing on that
const server = restify.createServer()
server.listen(12345, () => {
  routes(server, 'cache')

  describe.only('routing', () => {
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
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/item/:id gets called correctly', (done) => {
      client.get('/item/123', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items gets called correctly', (done) => {
      client.get('/items', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/:ids gets called correctly', (done) => {
      client.get('/items/123,456', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/all gets called correctly', (done) => {
      client.get('/items/all', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/all-prices gets called correctly', (done) => {
      client.get('/items/all-prices', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/autocomplete gets called correctly', (done) => {
      client.get('/items/autocomplete', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/by-name gets called correctly', (done) => {
      client.get('/items/by-name', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/by-skin gets called correctly', (done) => {
      client.get('/items/by-skin', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/query gets called correctly', (done) => {
      client.get('/items/query', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/items/categories gets called correctly', (done) => {
      client.get('/items/categories', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('ItemController.handle')
        done()
      })
    })

    it('/gem/history gets called correctly', (done) => {
      client.get('/gems/history', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('GemController.handle')
        done()
      })
    })

    it('initializes the controllers with the correct cache object', () => {
      let mockServer = {get: () => {}}
      let gemControllerSpy = sinon.spy()
      let itemControllerSpy = sinon.spy()

      routes.__set__('GemController', gemControllerSpy)
      routes.__set__('ItemController', itemControllerSpy)

      routes(mockServer, 'cache')

      expect(gemControllerSpy.calledOnce).to.equal(true)
      expect(gemControllerSpy.args[0][0]).to.equal('cache')
      expect(itemControllerSpy.calledOnce).to.equal(true)
      expect(itemControllerSpy.args[0][0]).to.equal('cache')
    })
  })
})
