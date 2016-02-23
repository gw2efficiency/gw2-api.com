/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const mockFs = require('mock-fs')
const fs = require('fs')
const cache = rewire('../src/cache.js')

const loggerMock = {success: sinon.spy(), info: sinon.spy(), error: sinon.spy()}
cache.__set__('logger', loggerMock)

describe('cache', () => {
  afterEach(() => {
    loggerMock.info.reset()
    loggerMock.success.reset()
    loggerMock.error.reset()
    mockFs.restore()
    cache.state = {}
  })

  it('loads the file into the cache state', () => {
    mockFs({
      'storage/cache.json': JSON.stringify({foo: 'bar'})
    })

    cache.load()
    expect(cache.state).to.deep.equal({foo: 'bar'})
    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('skips loading the file if it doesn\'t exist', () => {
    mockFs({
      'storage/': {}
    })

    cache.load()
    expect(cache.state).to.deep.equal({})
    expect(loggerMock.info.calledOnce).to.equal(true)
  })

  it('creates the directory if it doesn\'t exist', () => {
    mockFs()

    cache.load()
    expect(cache.state).to.deep.equal({})
    expect(fs.statSync('./storage/').isDirectory()).to.equal(true)
    expect(loggerMock.info.calledOnce).to.equal(true)
  })

  it('throws an error if the file is corrupted or fails loading', () => {
    mockFs({
      'storage/cache.json': 'i am not JSON so I should fail'
    })

    cache.load()
    expect(cache.state).to.deep.equal({})
    expect(loggerMock.error.calledOnce).to.equal(true)
  })

  it('can save the cache in a file as json', done => {
    mockFs({
      'storage/cache.json': '{}'
    })

    cache.state = {foo: 'bar'}
    cache.save()

    setTimeout(() => {
      expect(cache.state).to.deep.equal({foo: 'bar'})
      expect(fs.readFileSync('./storage/cache.json', 'utf-8')).to.equal(JSON.stringify({foo: 'bar'}))
      expect(loggerMock.success.calledOnce).to.equal(true)
      done()
    }, 10)
  })
})
