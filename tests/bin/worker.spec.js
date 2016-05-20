/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const worker = rewire('../../src/bin/worker.js')
const consoleMock = {log: sinon.spy(), error: sinon.spy()}
worker.__set__('console', consoleMock)

describe('bin > worker', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  it('can run the worker server', (done) => {
    setTimeout(() => {
      expect(consoleMock.log.args[0][0]).to.contain('jobs loaded, waiting for queued entries')
      done()
    }, 1000)
  })
})
