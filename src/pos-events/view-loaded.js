import { UNPROCESSED_ORDERS_LIST } from '../constants/templates'

export function onViewLoaded (view, params) {
  if (params.viewType === UNPROCESSED_ORDERS_LIST) {
    view.css('display', 'block')
  }
}
