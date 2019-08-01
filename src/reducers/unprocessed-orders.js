import { updatePickupStatus } from '../orders/pickup-status'
import { changeAttributeValue } from '../api/erply/utils'
import { PickupStatus } from '../constants/pickup-status'
import { UPDATE_ORDERS, SELECT_ORDER, UPDATE_ORDER_STATUS, PICK_ORDER } from '../actions/unprocessed-orders'

const initialState = {
  orders: [],
  selected: {
    id: null,
    number: '',
    clientName: '',
    type: '',
    date: '',
    notes: '',
    getAttributeValue: (name) => {}
  }
}

const unprocessedOrders = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_ORDERS:
      return {
        ...state,
        orders: action.orders
      }
    case SELECT_ORDER:
      return {
        ...state,
        selected: state.orders.find(order => order.id === action.id)
      }
    case UPDATE_ORDER_STATUS:
      return {
        ...state,
        orders: updateOrderStatus(state.orders, action)
      }
    case PICK_ORDER:
      return {
        ...state,
        orders: state.orders.map(order => {
          if (order.id !== action.id) {
            return order
          }

          const newOrder = _.cloneDeep(order)
          newOrder.rows = action.rows

          changeAttributeValue('pickupStatus', PickupStatus.PICKED, newOrder)

          return newOrder
        })
      }
    default:
      return state
  }
}

function updateOrderStatus (orders, action) {
  const a = orders.map(order => {
    if (order.id !== action.id) {
      return order
    }

    return updatePickupStatus(action.status, order)
  }).filter(
    order => parseInt(order.getAttributeValue('pickupProcessed')) === 0
  )

  return a
}

export default unprocessedOrders
