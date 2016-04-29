const categoryMap = require('../../static/categories.js')

function categories (request, response) {
  response.send(categoryMap)
}

module.exports = categories
