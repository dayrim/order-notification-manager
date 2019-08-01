import 'stupid-table-plugin'

import { NotificationButton } from './components/notification-button'
import { store } from './store'
import Updater from './updater'
import { UnprocessedOrdersList } from './views/unprocessed-orders/list'
import { ViewUnprocessedOrder } from './views/unprocessed-orders/view-order'
import { PickingConfirmation } from './views/unprocessed-orders/picking-confirmation'
import { EditUnprocessedOrder } from './views/unprocessed-orders/edit'
import { onDocumentReturnSaveAction } from './pos-events/document-return-save-action'
import { onBeforeDocumentSave } from './pos-events/before-document-save'
import { onAfterDocumentSave } from './pos-events/after-document-save'
import { onViewLoaded } from './pos-events/view-loaded'
import {
  UNPROCESSED_ORDERS_LIST,
  VIEW_UNPROCESSED_ORDER,
  PICKING_CONFIRMATION,
  EDIT_UNPROCESSED_ORDER
} from './constants/templates'
import { updateOrderStatus } from './actions/unprocessed-orders'
import { isOnmOrder } from './orders/delivery-type'

// global variable
window.onm = {
  views: {},
  currentDocument: null,
  cashInvoiceReturn: {
    document: null,
    returnDocument: null
  }
}

registerViews()

function registerViews () {
  window.onm.views[UNPROCESSED_ORDERS_LIST] = new UnprocessedOrdersList(store)
  window.onm.views[VIEW_UNPROCESSED_ORDER] = new ViewUnprocessedOrder(store)
  window.onm.views[PICKING_CONFIRMATION] = new PickingConfirmation(store)
  window.onm.views[EDIT_UNPROCESSED_ORDER] = new EditUnprocessedOrder(store)
}

TSPOS.EventManager.addEventListener('before_document_save', onBeforeDocumentSave)
TSPOS.EventManager.addEventListener('after_document_save', onAfterDocumentSave)
TSPOS.EventManager.addEventListener('document_return_save_action', onDocumentReturnSaveAction)
TSPOS.EventManager.addEventListener('view_loaded', onViewLoaded)
TSPOS.EventManager.addEventListener('onm_after_order_status_update', ({ order, status }) => {
  store.dispatch(updateOrderStatus(order.id, status))

  TSPOS.EventManager.runEventListener('onm_after_orders_update', {
    orders: store.getState().unprocessedOrders.orders
  })
})

$(() => {
  if ($('.app-header-nav #onm-notification-button-container').length === 0) {
    $('.app-header-nav').prepend(new NotificationButton(store).render())
  }

  // Disable pre-payments for orders
  const targetNode = document.querySelector('#payment-modal .payment-change-label + span.pull-right')
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (parseFloat(mutation.target.innerText) < 0 && isOnmOrder(TSPOS.Model.Document)) {
        $('button[data-action="payment-confirm"]').addClass('disabled')
      } else if (parseFloat(mutation.target.innerText) >= 0 && isOnmOrder(TSPOS.Model.Document)) {
        $('button[data-action="payment-confirm"]').removeClass('disabled')
      }
    })
  })

  observer.observe(targetNode, { childList: true })
})

const updater = new Updater(store)

updater.check(60000)
