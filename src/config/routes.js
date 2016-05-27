// This file defines all routes and function handling these routes.
// All routes are accessible using GET and POST methods.

const routes = {
  '/item': require('../controllers/items/byId.js'),
  '/item/:id': require('../controllers/items/byId.js'),
  '/items': require('../controllers/items/byIds.js'),
  '/items/all': require('../controllers/items/all.js'),
  '/items/all-prices': require('../controllers/items/allPrices.js'),
  '/items/all-values': require('../controllers/items/allValues.js'),
  '/items/categories': require('../controllers/items/categories.js'),
  '/items/autocomplete': require('../controllers/items/autocomplete.js'),
  '/items/by-name': require('../controllers/items/byName.js'),
  '/items/by-skin': require('../controllers/items/bySkin.js'),
  '/items/by-crafting-profit': require('../controllers/items/byCraftingProfit.js'),
  '/items/query': require('../controllers/items/query.js'),
  '/items/:ids': require('../controllers/items/byIds.js'),
  '/skins/resolve': require('../controllers/skins/resolve.js'),
  '/skins/prices': require('../controllers/skins/prices.js'),
  '/recipe/nested/:ids': require('../controllers/recipes/nested.js'),
  '/gems/history': require('../controllers/gems/history.js')
}

module.exports = routes
