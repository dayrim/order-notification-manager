/**
 * Converts array of objects to a flattened object that can be used when saving
 * things in erply api
 * @param {Object[]} arr
 */
export function flatten (arr) {
  const result = {}

  arr.forEach((value, index) => {
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        result[`${key}${index}`] = value[key]
      }
    }
  })

  return result
}

export function findAttributeIndex (name, record) {
  if (!record.hasOwnProperty('attributes')) {
    return -1
  }

  for (let i = 0; i < record.attributes.length; i++) {
    if (record.attributes[i].attributeName === name) {
      return i
    }
  }

  return -1
}

export function changeAttributeValue (name, value, record) {
  const index = findAttributeIndex(name, record)

  if (index !== -1) {
    record.attributes[index].attributeValue = value
  }

  return record
}
