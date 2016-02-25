// Merge an array of objects and an another array of objects into each other based on id.
// Optional skipping of non existing entries as well as transforming based on both objects
function mergeById (original, additional, skipNonExisting = false, transformer = null) {
  original = original || []
  additional = convertIntoMap(additional)

  // Merge existing elements
  original = original.map(o => {
    if (additional[o.id] === undefined) {
      return o
    }

    let addition = additional[o.id]
    delete additional[o.id]

    if (transformer) {
      addition = transformer(o, addition)
    }

    return {...o, ...addition}
  })

  if (skipNonExisting) {
    return original
  }

  // Include previously non-existing elements
  for (let id in additional) {
    original.push(additional[id])
  }

  return original
}

function convertIntoMap (array) {
  var map = {}
  array.map(element => {
    map[element.id] = element
  })
  return map
}

module.exports = mergeById
