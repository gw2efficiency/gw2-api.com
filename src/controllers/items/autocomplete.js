const mongo = require('../../helpers/mongo.js')
const {invalidParameters, requestLanguage} = require('../../helpers/controllers.js')
const escapeRegex = require('escape-string-regexp')

async function autocomplete (request, response) {
  if (!request.params.q) {
    return invalidParameters(response)
  }

  let lang = requestLanguage(request.params)
  let query = request.params.q.toLowerCase()
  let craftable = parseInt(request.params.craftable, 10) === 1

  if (query.length < 2) {
    return response.send([])
  }

  let mongoQuery = {
    name: {$regex: escapeRegex(query), $options: 'i'},
    lang: lang
  }

  if (craftable) {
    mongoQuery['craftable'] = true
  }

  let items = await mongo.collection('items')
    .find(mongoQuery, {_id: 0, lang: 0, valueIsVendor: 0})
    .toArray()

  // We sort the items on request, since sorting them
  // in the database would invoke exactly the same code
  items.sort((a, b) => {
    a = matchQuality(a.name.toLowerCase(), query)
    b = matchQuality(b.name.toLowerCase(), query)
    return a - b
  })

  response.send(items.slice(0, 20))
}

// Determine the quality of matching a query string in a target string
function matchQuality (target, query) {
  if (target === query) {
    return 0
  }

  let index = target.indexOf(query)
  return 1 + index
}

module.exports = autocomplete
