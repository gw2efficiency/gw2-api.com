/* eslint-env node, mocha */
const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')

const worker = rewire('../../src/workers/recipe.js')
const mongo = require('../../src/helpers/mongo.js')
mongo.logger.quiet(true)

const executeMock = sinon.spy()
worker.__set__('execute', executeMock)

const scheduleMock = sinon.spy()
worker.__set__('schedule', scheduleMock)

// Overwrite the nesting so we don't have the overhead of nesting while
// still being able to insert by item id into mongodb
worker.__set__('recipeNesting', (recipes) => recipes.map(r => ({...r, id: r.output_item_id})))

const requesterMock = require('gw2e-requester/mock')
worker.__set__('requester', requesterMock)

describe('workers > recipe worker', () => {
  before(async () => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
  })

  beforeEach(async () => {
    await mongo.collection('recipe-trees').deleteMany({})
    await mongo.collection('items').deleteMany({})
    executeMock.reset()
    scheduleMock.reset()
  })

  it('initializes correctly without data', async () => {
    await mongo.collection('items').insert({id: 1, name: 'placeholder item'})
    await worker.initialize()

    expect(executeMock.callCount).to.equal(1)
    expect(executeMock.args[0][0].name).to.equal('loadRecipeList')

    expect(scheduleMock.callCount).to.equal(1)
    expect(scheduleMock.args[0][1].name).to.equal('loadRecipeList')
  })

  it('initializes correctly with data', async () => {
    await mongo.collection('items').insert({id: 1, hint: 'placeholder item'})
    await mongo.collection('recipe-trees').insert({id: 1, hint: 'placeholder recipe'})
    await worker.initialize()

    expect(executeMock.callCount).to.equal(0)

    expect(scheduleMock.callCount).to.equal(1)
    expect(scheduleMock.args[0][1].name).to.equal('loadRecipeList')
  })

  it('loads the recipe list correctly', async () => {
    await mongo.collection('items').insert([{id: 1}, {id: 9001}])
    let tmp = worker.__get__('loadCustomRecipes')
    worker.__set__('loadCustomRecipes', () => [{output_item_id: 1}, {output_item_id: 3}])
    worker.__set__('api', () => ({
      recipes: () => ({
        all: () => [{output_item_id: 1}, {output_item_id: 2, ingredients: [1, 2, 3]}]
      })
    }))

    await worker.loadRecipeList()

    let expectedRecipes = [
      {id: 1, output_item_id: 1},
      {id: 2, output_item_id: 2, ingredients: [1, 2, 3]},
      {id: 3, output_item_id: 3}
    ]

    let recipes = await mongo.collection('recipe-trees').find({}, {_id: 0}).sort({id: 1}).toArray()
    expect(recipes).to.deep.equal(expectedRecipes)

    let items = await mongo.collection('items').find({}, {_id: 0}).sort({id: 1}).toArray()
    expect(items).to.deep.equal([{id: 1, craftable: true}, {id: 9001, craftable: false}])

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
