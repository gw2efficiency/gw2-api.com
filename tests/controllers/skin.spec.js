/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const controller = rewire('../../src/controllers/skin.js')

let storage = controller.__get__('storage')
storage.save = sinon.spy()
storage.load = sinon.spy()

describe('controllers > skin', () => {
  it('handles /skins/resolve', async () => {
    let content = {'1': [1, 2], '2': [3, 4]}
    let response = {send: sinon.spy()}
    storage.set('skinsToItems', content)

    controller.resolve(null, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal(content)
  })
})
