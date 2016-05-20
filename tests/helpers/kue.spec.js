/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const kue = rewire('../../src/helpers/kue.js')

let createQueueSpy = sinon.spy()
kue.__set__('createQueue', createQueueSpy)

describe('helpers > kue', () => {
  it('overwrites the createQueue functionality with defaults', () => {
    kue.createQueue()

    expect(createQueueSpy.called).to.equal(true)
    expect(createQueueSpy.args[0][0]).to.deep.equal({
      prefix: 'kue-',
      redis: {host: '127.0.0.1', port: 6379}
    })
  })
})
