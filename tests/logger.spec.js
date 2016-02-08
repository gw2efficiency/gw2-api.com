/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const mockdate = require('mockdate')
const logger = rewire('../src/logger.js')

let consoleMock = {log: sinon.spy()}
logger.__set__('console', consoleMock)

describe('logger', function () {
  beforeEach(() => {
    consoleMock.log.reset()
  })

  it('logs info messages to console', async () => {
    logger.info('fiz')
    expect(consoleMock.log.calledOnce).to.equal(true)
    expect(consoleMock.log.args[0][0]).to.contain('fiz')
    expect(consoleMock.log.args[0][0]).to.contain(logger.__get__('prefix')())
  })

  it('logs success messages to console', async () => {
    logger.success('buz')
    expect(consoleMock.log.calledOnce).to.equal(true)
    expect(consoleMock.log.args[0][0]).to.contain('buz')
    expect(consoleMock.log.args[0][0]).to.contain(logger.__get__('prefix')())
  })

  it('logs error messages to console', async () => {
    logger.error('fizbuz')
    expect(consoleMock.log.calledOnce).to.equal(true)
    expect(consoleMock.log.args[0][0]).to.contain('fizbuz')
    expect(consoleMock.log.args[0][0]).to.contain(logger.__get__('prefix')())
  })

  it('prefixes messages with the date and time', async () => {
    mockdate.set('Sat Nov 17 2014 05:07:00 GMT+0100 (GMT)')
    logger.info('happy times')
    expect(consoleMock.log.args[0][0]).to.contain('17/11 05:07')
    mockdate.reset()
  })
})
