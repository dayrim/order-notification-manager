export function leftPad (str, targetLength, padString = ' ') {
  if (str.length >= targetLength) {
    return str
  }

  targetLength = targetLength - str.length

  if (targetLength > padString.length) {
    padString += padString.repeat(targetLength / padString.length)
  }

  return padString.slice(0, targetLength) + str
}
