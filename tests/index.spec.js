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

let gemControllerHandler = 0
const Module = proxyquire('../src/index.js', {
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
  './cache.js': {foo: 'bar'}
})

describe('server', () => {
  it('can run the server', () => {
    expect(Module).to.exist
  })

  it('initializes the workers correctly', () => {
    expect(gemWorker.constructor.called).to.equal(true)
    expect(gemWorker.constructor.args[0][0]).to.be.an.instanceOf(require('gw2api-client'))
    expect(gemWorker.constructor.args[0][1]).to.deep.equal({foo: 'bar'})
    expect(gemWorker.initialize.calledOnce).to.equal(true)
  })

  it('calls GemController.handler for the /gem/history url', (done) => {
    client.get('/gems/history', err => {
      if (err) throw err
      expect(gemControllerHandler).to.equal(1)
      done()
    })
  })
})
