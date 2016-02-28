/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const controller = require('../../src/helpers/controllers.js')

describe('helpers > controller helpers', () => {
  it('sends an error response for invalid parameters', async () => {
    let response = {send: sinon.spy()}
    controller.invalidParameters(response)
    expect(response.send.args[0][0]).to.equal(400)
  })

  it('finds the correct request language', async () => {
    expect(controller.requestLanguage({lang: 'de'})).to.equal('de')
    expect(controller.requestLanguage({lang: 'en'})).to.equal('en')
    expect(controller.requestLanguage({lang: 'fr'})).to.equal('fr')
    expect(controller.requestLanguage({lang: 'es'})).to.equal('es')
    expect(controller.requestLanguage({lang: 'derp'})).to.equal('en')
    expect(controller.requestLanguage({})).to.equal('en')
  })

  it('can get the multiple parameters in a key as an array', async () => {
    expect(controller.multiParameter()).to.deep.equal([])
    expect(controller.multiParameter([1, 2])).to.deep.equal([1, 2])
    expect(controller.multiParameter('1,2', true)).to.deep.equal([1, 2])
    expect(controller.multiParameter(['1', '2'], true)).to.deep.equal([1, 2])
    expect(controller.multiParameter('foo,Bar')).to.deep.equal(['foo', 'Bar'])
    expect(controller.multiParameter('1;2', false, ';')).to.deep.equal(['1', '2'])
  })
})
