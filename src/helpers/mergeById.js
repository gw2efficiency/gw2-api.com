// Merge an array of objects and an another array of objects into each other based on id.
// Optional skipping of non existing entries as well as transforming based on both objects
function mergeById (original, additional, skipNonExisting = false, transformer = null) {
  original = original || []

  additional.map(addElem => {
    let orgElem = original.find(x => x.id === addElem.id)

    if (skipNonExisting && !orgElem) {
      return
    }

    if (transformer) {
      addElem = transformer(orgElem, addElem)
    }

    orgElem ? Object.assign(orgElem, addElem) : original.push(addElem)
  })

  return original
}

module.exports = mergeById
