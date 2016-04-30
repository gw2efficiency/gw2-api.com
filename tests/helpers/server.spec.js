/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const restify = require('restify')

const server = rewire('../../src/helpers/server.js')
const loggerMock = {info: sinon.spy(), success: sinon.spy(), error: sinon.spy()}
server.__set__('logger', loggerMock)

// Mock a route
const mockRoutes = {
  '/random-bound-route': (req, res) => res.send('Random response')
}

// Start a mock server and a mock client -> test the routing
const mockServer = restify.createServer()
const mockClient = restify.createJsonClient({
  url: 'http://127.0.0.1:12345',
  version: '*'
})

mockServer.listen(12345, () => {
  beforeEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
  })

  server.setupRoutes(mockServer, mockRoutes)
  server.setupErrorHandling(mockServer)

  describe('routes > setup routes', () => {
    it('the index redirects correctly', (done) => {
      mockClient.get('/', (err, req, res) => {
        if (err) throw err
        expect(res.statusCode).to.equal(302)
        expect(res.headers.location).to.contain('github')
        done()
      })
    })

    it('a bound route gets called correctly', (done) => {
      mockClient.get('/random-bound-route', (err, req, res, data) => {
        if (err) throw err
        expect(data).to.equal('Random response')
        done()
      })
    })

    it('binds controllers correctly to routes', () => {
      let wrap = server.__get__('wrapRequest')

      function someMethod (req, res) {
        res.send({text: 'Some'})
      }

      let boundController = wrap(someMethod)
      expect(boundController).to.be.a.function

      let res = {cache: sinon.spy(), charSet: sinon.spy(), send: sinon.spy(), setHeader: sinon.spy()}
      let next = sinon.spy()
      boundController({path: () => ''}, res, next)

      expect(res.cache.calledOnce).to.equal(true)
      expect(res.charSet.calledOnce).to.equal(true)
      expect(res.sendParent.calledOnce).to.equal(true)
      expect(next.calledOnce).to.equal(true)
      expect(res.sendParent.args[0][0]).to.deep.equal({text: 'Some'})
    })

    it('catches rejections from promises', (done) => {
      let wrap = server.__get__('wrapRequest')

      function someMethod () {
        return new Promise((resolve, reject) => {
          let err = new Error('some message')
          err.stack = 'OH NO SOMETHING BAD :('
          reject(err)
        })
      }

      let boundController = wrap(someMethod)
      let res = {cache: sinon.spy(), charSet: sinon.spy(), send: sinon.spy(), setHeader: sinon.spy()}
      let next = sinon.spy()
      boundController({path: () => ''}, res, next)

      setTimeout(() => {
        expect(loggerMock.error.calledOnce).to.equal(true)
        expect(res.sendParent.args[0][0]).to.equal(500)
        expect(res.sendParent.args[0][1]).to.deep.equal({text: 'internal error'})
        done()
      }, 25)
    })
  })

  describe('routes > setup error handling', () => {
    it('logs errors and returns the correct response for missing routes', (done) => {
      mockClient.get('/this/is/a/nonexisting/route', (err, req, res) => {
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
      mockServer.get('/gems/history', () => {
        console.log('Some fake route.')
      })

      mockClient.del('/gems/history', (err, req, res) => {
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
      mockServer.get('/failing/route', () => {
        let err = new Error('some message')
        err.stack = 'OH NO SOMETHING BAD :('
        throw err
      })

      mockClient.get('/failing/route', (err, req, res) => {
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
