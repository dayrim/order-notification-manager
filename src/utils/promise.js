export function promisify (jQueryPromise) {
  return new Promise((resolve, reject) => jQueryPromise.then(resolve, reject))
}
