/* eslint-env node, mocha */
const expect = require('chai').expect
const rewire = require('rewire')

const recipeList = rewire('../../../src/workers/recipes/recipeList.js')
const mongo = require('../../../src/helpers/mongo.js')
mongo.logger.quiet(true)

// Overwrite the nesting so we don't have the overhead of nesting while
// still being able to insert by item id into mongodb
recipeList.__set__('recipeNesting', (recipes) => recipes.map(r => ({...r, id: r.output_item_id})))
recipeList.__set__('customRecipes', () => [{output_item_id: 1}, {output_item_id: 3}])

describe('workers > recipes > recipeList', () => {
  before(async (done) => {
    await mongo.connect('mongodb://127.0.0.1:27017/gw2api-test')
    done()
  })

  beforeEach(async (done) => {
    await mongo.collection('recipe-trees').deleteMany({})
    await mongo.collection('items').deleteMany({})
    done()
  })

  it('loads the recipe list', async () => {
    await mongo.collection('items').insert([{id: 1}, {id: 9001}])

    recipeList.__set__('api', () => ({
      recipes: () => ({
        all: () => [{output_item_id: 1}, {output_item_id: 2, ingredients: [1, 2, 3]}]
      })
    }))

    await recipeList()

    let expectedRecipes = [
      {id: 1, output_item_id: 1},
      {id: 2, output_item_id: 2, ingredients: [1, 2, 3]},
      {id: 3, output_item_id: 3}
    ]

    let recipes = await mongo.collection('recipe-trees')
      .find({}, {_id: 0})
      .sort({id: 1}).toArray()
    expect(recipes).to.deep.equal(expectedRecipes)

    let items = await mongo.collection('items')
      .find({}, {_id: 0})
      .sort({id: 1}).toArray()
    expect(items).to.deep.equal([{id: 1, craftable: true}, {id: 9001, craftable: false}])
  })
})
