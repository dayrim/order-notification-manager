import { changeAttributeValue } from '../api/erply/utils'
import { PickupStatus } from '../constants/pickup-status'

export function updatePickupStatus (newStatus, order) {
  const newOrder = _.cloneDeep(order)

  changeAttributeValue('pickupStatus', newStatus, newOrder)

  if (
    newStatus === PickupStatus.CANCELLED ||
    newStatus === PickupStatus.CONFIRMED ||
    newStatus === PickupStatus.DELIVERED
  ) {
    changeAttributeValue('pickupProcessed', 1, newOrder)
  }

  return newOrder
}

export function getActionTextForStatus (status) {
  switch (status) {
    case PickupStatus.NEW:
      return 'order.action.start.picking'
    case PickupStatus.PICKING:
      return 'order.action.finish.picking'
    case PickupStatus.PICKED:
      return 'order.action.confirm'
    case PickupStatus.CANCELLED:
      return 'order.action.move.history'
    default:
      return ''
  }
}
