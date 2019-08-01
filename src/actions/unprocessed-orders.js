export const UPDATE_ORDERS = 'UPDATE_ORDERS'
export const SELECT_ORDER = 'SELECT_ORDER'
export const UPDATE_ORDER_STATUS = 'UPDATE_ORDER_STATUS'
export const PICK_ORDER = 'PICK_ORDER'

export function updateOrders (orders) {
  return {
    type: UPDATE_ORDERS,
    orders
  }
}

export function selectOrder (id) {
  return {
    type: SELECT_ORDER,
    id
  }
}

export function updateOrderStatus (id, status) {
  return {
    type: UPDATE_ORDER_STATUS,
    id,
    status
  }
}

export function pickOrder (id, rows) {
  return {
    type: PICK_ORDER,
    id,
    rows
  }
}
