/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const controller = rewire('../../src/controllers/recipe.js')

let storage = controller.__get__('storage')

describe('controllers > recipe', () => {
  it('handles /recipe/nested/:id', async () => {
    let recipes = [
      {id: 1, ingredients: [1, 2, 3]},
      {id: 2, ingredients: [4, 5, 6]},
      {id: 3, ingredients: [4, 5, 6]}
    ]
    let response = {send: sinon.spy()}
    storage.set('recipeTrees', recipes)

    controller.nested({params: {id: 2}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.deep.equal({id: 2, ingredients: [4, 5, 6]})
  })

  it('handles /recipe/nested/:id with missing parameters', () => {
    let response = {send: sinon.spy()}

    controller.nested({params: {}}, response)
    expect(response.send.calledOnce).to.equal(true)
    expect(response.send.args[0][0]).to.equal(400)
    expect(response.send.args[0][1]).to.deep.equal({text: 'invalid request parameters'})
  })
})
