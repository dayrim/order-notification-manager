export function sumProps (arr, prop) {
  return arr.reduce((acc, item) => acc + parseFloat(item[prop]), 0)
}
