/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')

const customRecipes = rewire('../../../src/workers/recipes/_customRecipes.js')

const requesterMock = require('gw2e-requester/mock')
customRecipes.__set__('requester', requesterMock)

describe('workers > recipes > customRecipes', () => {
  it('loads and filters custom recipes', async () => {
    let input = [
      {output_item_id: -1, ingredients: [{item_id: 5}]},
      {output_item_id: 2, ingredients: [{item_id: -5}]},
      {output_item_id: 3, ingredients: [{item_id: 5}]},
      {output_item_id: 4, ingredients: [{item_id: 4}]},
      {output_item_id: 38023, ingredients: [{item_id: 38024}]},
      {output_item_id: 38116, ingredients: [{item_id: 6}]},
      {output_item_id: 5, ingredients: [{item_id: 6}]}
    ]

    let output = [
      {output_item_id: 3, ingredients: [{item_id: 5}]},
      {output_item_id: 5, ingredients: [{item_id: 6}]}
    ]

    requesterMock.addResponse(input)
    let recipes = await customRecipes()
    expect(recipes).to.deep.equal(output)
  })
})
