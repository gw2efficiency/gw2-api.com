/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const worker = rewire('../../src/workers/recipe.js')

const loggerMock = {success: sinon.spy()}
worker.__set__('logger', loggerMock)

const executeMock = sinon.spy()
worker.__set__('execute', executeMock)

const scheduleMock = sinon.spy()
worker.__set__('schedule', scheduleMock)

let storage = worker.__get__('storage')
storage.save = () => true

const nestingMock = sinon.stub().returnsArg(0)
worker.__set__('recipeNesting', nestingMock)

const requesterMock = require('requester/mock')
worker.__set__('requester', requesterMock)

describe('workers > recipe worker', () => {
  beforeEach(() => {
    loggerMock.success.reset()
    executeMock.reset()
    scheduleMock.reset()
    storage.set('recipeTrees')
    storage.set('items')
  })

  it('initializes correctly without data', async () => {
    await worker.initialize()

    expect(executeMock.calledOnce).to.equal(true)
    expect(executeMock.args[0][0].name).to.equal('loadRecipeList')
    expect(scheduleMock.calledOnce).to.equal(true)
    expect(scheduleMock.args[0][0].name).to.equal('loadRecipeList')
    expect(scheduleMock.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
  })

  it('initializes correctly with data', async () => {
    worker.__set__('storage', {
      set: () => true,
      get: () => 'we have data!'
    })
    await worker.initialize()

    expect(executeMock.callCount).to.equal(0)
    expect(scheduleMock.calledOnce).to.equal(true)
    expect(scheduleMock.args[0][0].name).to.equal('loadRecipeList')
    expect(scheduleMock.args[0][1]).to.be.an.integer
    expect(loggerMock.success.calledOnce).to.equal(true)
    worker.__set__('storage', storage)
  })

  it('loads the recipe list correctly', async () => {
    let tmp = worker.__get__('loadCustomRecipes')
    worker.__set__('loadCustomRecipes', () => [{output_item_id: 1}, {output_item_id: 3}])
    worker.__set__('api', () => ({
      recipes: () => ({
        all: () => [{output_item_id: 1}, {output_item_id: 2, ingredients: [1, 2, 3]}]
      })
    }))

    await worker.loadRecipeList()

    let expected = [
      {output_item_id: 1},
      {output_item_id: 2, ingredients: [1, 2, 3]},
      {output_item_id: 3}
    ]

    expect(storage.get('recipeTrees')).to.deep.equal(expected)
    expect(nestingMock.calledOnce).to.equal(true)
    expect(nestingMock.args[0][0]).to.deep.equal(expected)

    worker.__set__('loadCustomRecipes', tmp)
  })

  it('loads and filters custom recipes correctly', async () => {
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
    let recipes = await worker.__get__('loadCustomRecipes')()
    expect(recipes).to.deep.equal(output)
  })
})
