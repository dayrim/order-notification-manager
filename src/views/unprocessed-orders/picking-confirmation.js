import { Modal } from '../../templates/modal'
import { t } from '../../localization'
import { Orders } from '../../api/erply/orders'
import { PickupStatus } from '../../constants/pickup-status'
import { renderStoredView } from '../../utils/view'
import { ErplyApi } from '../../api/erply/api'
import { UNPROCESSED_ORDERS_LIST, EDIT_UNPROCESSED_ORDER } from '../../constants/templates'
import { toErrorNotification } from '../../utils/notification'

export class PickingConfirmation {
  constructor (store) {
    this.store = store
    this.html = $('<div></div>')
  }

  render () {
    this.html = $(Modal({
      id: 'onm-picking-confirmation',
      title: t('order.picking.title'),
      dismissable: true,
      body: `<h4>${t('order.picking.text')}</h4>`,
      footer: `
          <button id="onm-confirm-yes" class="btn btn-save-view bold text-uppercase">${t('confirm.yes')}</button>
          <button id="onm-confirm-no" class="btn btn-cancel bold text-uppercase">${t('confirm.no')}</button>`
    }))

    this.html.on('click', '#onm-confirm-yes', e => this.onYes(e))
    this.html.on('click', '#onm-confirm-no', e => this.onNo(e))

    return this.html
  }

  async onYes (evt) {
    const order = this.store.getState().unprocessedOrders.selected
    const notification = ERPLY.Alert(t('order.save.action.text'))

    try {
      await Orders.updatePickupStatus(order, PickupStatus.PICKED)

      TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
        order: order,
        status: PickupStatus.PICKED
      })
    } catch (err) {
      Ember.Logger.error(err, err.ctx)
      return void toErrorNotification(
        notification,
        t('order.save.action.error', { error: err.message })
      )
    }

    notification.close()
    TSPOS.UI.closeCurrentView()

    renderStoredView({
      viewType: UNPROCESSED_ORDERS_LIST,
      dismiss: true,
      modal: false
    })
  }

  onClose () {
    renderStoredView({
      viewType: UNPROCESSED_ORDERS_LIST,
      dismiss: true,
      modal: false
    })
  }

  async onNo () {
    const order = this.store.getState().unprocessedOrders.selected

    if (order.type === 'ORDER') {
      TSPOS.UI.closeCurrentView()

      renderStoredView({
        viewType: EDIT_UNPROCESSED_ORDER,
        dismiss: true,
        modal: false
      })
    } else {
      let payments = []

      try {
        payments = (await ErplyApi.sendRequest('getPayments', {
          documentID: order.id
        })).getRecords()
      } catch (err) {}

      if (payments.length === 0) {
        ERPLY.Error(t('order.invalid.cashinvoice.error')).delayedClose(4)
        return void TSPOS.UI.closeCurrentView()
      }

      TSPOS.UI.closeCurrentView()
      TSPOS.Model.Document.documentReturn()

      $('body').find('#search-return-document-field').val(order.number)
      setTimeout(() => {
        $('body').find('.search-return-document').trigger('click')
      }, 100)
    }
  }
}
