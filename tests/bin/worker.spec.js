/* eslint-env node, mocha */
const proxyquire = require('proxyquire')
const expect = require('chai').expect
const sinon = require('sinon')

const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const schedulingSpy = sinon.spy()

proxyquire('../../src/bin/worker.js', {
  '../helpers/worker.js': schedulingSpy
})

describe('bin > worker', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  it('initializes the scheduling', () => {
    expect(schedulingSpy.called).to.equal(true)
    expect(schedulingSpy.args[0][0]).to.be.a.string
    expect(schedulingSpy.args[0][1]).to.be.a.function
  })
})
