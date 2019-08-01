import { leftPad } from './string'

function prependZeroIfSingle (str) {
  str = str.toString()

  if (str.length === 1) {
    return '0' + str
  }

  return str
}

export function dateToDateTimeString (date) {
  const year = date.getFullYear()
  const month = prependZeroIfSingle(date.getMonth() + 1)
  const day = prependZeroIfSingle(date.getDate())
  const hours = prependZeroIfSingle(date.getHours())
  const minutes = prependZeroIfSingle(date.getMinutes())
  const seconds = prependZeroIfSingle(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function getOrderDateTime (date) {
  if (!date) {
    return ''
  }

  const dt = new Date(date + ' UTC')
  const selectedWarehouse = parseInt(TSPOS.Model.POS.selectedWarehouseID)
  const warehouse = TSPOS.Model.Warehouse.data.find(
    warehouse => parseInt(warehouse.warehouseID) === selectedWarehouse
  )

  let timeZone = null

  if (!warehouse || !warehouse.timeZone) {
    Ember.Logger.warn(`Could not find timezone information for ${selectedWarehouse}`)
  } else {
    timeZone = warehouse.timeZone
  }

  let orderDateTimeFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }

  if (timeZone) {
    orderDateTimeFormat.timeZone = timeZone
  }

  // A bad hack
  const dateString = dt.toLocaleDateString('en-US', orderDateTimeFormat)
  const newDt = new Date(dateString)

  const year = newDt.getFullYear()
  let month = leftPad((newDt.getMonth() + 1).toString(), 2, '0')
  let day = leftPad(newDt.getDate().toString(), 2, '0')
  let hours = leftPad(newDt.getHours().toString(), 2, '0')
  let minutes = leftPad(newDt.getMinutes().toString(), 2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}
