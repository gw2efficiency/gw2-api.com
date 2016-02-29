/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const api = rewire('../../src/helpers/api.js')

const clientMock = {
  requester: {
    retry: sinon.spy(),
    retryWait: sinon.spy()
  }
}
api.__set__('client', () => clientMock)

describe('helpers > api', () => {
  it('creates an api object', async () => {
    expect(api()).to.deep.equal(clientMock)
    expect(clientMock.requester.retry.calledOnce).to.equal(true)
    expect(clientMock.requester.retryWait.calledOnce).to.equal(true)
  })

  it('retries correctly', async () => {
    let retry = api.__get__('retry')
    expect(retry(0, {response: {status: 200}})).to.equal(false)
    expect(retry(6, {response: {status: 403}})).to.equal(false)
    expect(retry(6, {response: {status: 100}})).to.equal(false)
    expect(retry(2, {response: {status: 500}})).to.equal(true)
    expect(retry(2, {})).to.equal(true)
  })

  it('sets a retry wait time', async () => {
    let retryWait = api.__get__('retryWait')
    expect(retryWait(5)).to.be.above(100)
  })
})
