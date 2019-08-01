import Big from 'big.js'
import { Modal } from '../../templates/modal'
import { t, getPickupStatusKey } from '../../localization'
import { renderStoredView } from '../../utils/view'
import { PickupStatus } from '../../constants/pickup-status'
import { Orders } from '../../api/erply/orders'
import { UNPROCESSED_ORDERS_LIST } from '../../constants/templates'
import { getDeliveryType } from '../../orders/delivery-type'
import { toErrorNotification } from '../../utils/notification'
import { pricesDisplayedWithTax } from '../../utils/config'
import { getOrderDateTime } from '../../utils/date'
import { calculateDocumentTotals } from '../../utils/document';

const OrderRow = ({ row }) => {
  const price = new Big(pricesDisplayedWithTax() ? row.finalPriceWithVAT : row.finalNetPrice)
  const total = new Big(row.amount).times(price)

  return `<tr>
    <td>${_.escape(row.itemName)}</td>
    <td>${_.escape(row.amount)}</td>
    <td>${price.toFixed(2)}</td>
    <td>${total.toFixed(2)}</td>
  </tr>`
}

const PickupStatusSelect = ({ order, value }) => (
  `<select class="form-control mx-sm-3" name="onm-edit-pickup-status">
  ${Object.keys(PickupStatus).filter(key => {
    // Disable confirmed and delivered status changes
    if (PickupStatus[key] === PickupStatus.CONFIRMED || PickupStatus[key] === PickupStatus.DELIVERED) {
      return false
    }

    if (PickupStatus[key] === PickupStatus.CANCELLED && order.type === 'CASHINVOICE') {
      return false
    }

    return true
  }).map(key => (
    `<option value="${key}" ${PickupStatus[key] === value ? 'selected' : ''}>
        ${t(getPickupStatusKey(PickupStatus[key]))}
      </option>`
  )).join('')}
  </select>`
)

export class ViewUnprocessedOrder {
  constructor (store) {
    this.store = store
    this.html = $(`<div></div>`)
  }

  render () {
    const order = this.store.getState().unprocessedOrders.selected
    const totals = calculateDocumentTotals(order)

    this.html.find('.btn-save-view').off('click')

    this.html = $(Modal({
      id: 'onm-view-order',
      title: `<span>${t('order.with.number', { number: order.number })}<span>`,
      actions: `
        <button type="button" class="btn-save-view bold text-uppercase">
          ${t('order.action.save')}
        </button>
      `,
      body: `
        <div>
          <div>
            <table class="table table-white table-customer">
              <tr>
                <td><strong>${t('order.number')}</strong></td>
                <td>${_.escape(order.number)}</td>
              </tr>
              <tr>
                <td><strong>${t('order.pickup.type')}</strong></td>
                <td>${getDeliveryType(order)}</td>
              </tr>
              <tr>
                <td><strong>${t('order.date.created')}</strong></td>
                <td>${_.escape(order.date)}</td>
              </tr>
              <tr>
                <td><strong>${t('order.pickup.date.time')}</strong></td>
                <td>${_.escape(getOrderDateTime(order.getAttributeValue('pickupDateTime')))}</td>
              </tr>
              <tr>
                <td><strong>${t('order.delivery.date.time')}</strong></td>
                <td>${_.escape(getOrderDateTime(order.getAttributeValue('deliveryDateTime')))}</td>
              </tr>
              <tr>
                <td><strong>${t('customer')}</strong></td>
                <td>${_.escape(order.clientName)}</td>
              </tr>
              <tr>
                <td><strong>${t('customer.card.number')}</strong></td>
                <td>${_.escape(order.clientCardNumber)}</td>
              </tr>
              <tr>
                <td><strong>${t('order.status')}</strong></td>
                <td id="onm-view-order-status">
                  ${PickupStatusSelect({ order: order, value: order.getAttributeValue('pickupStatus') })}
                </td>
              </tr>
              <tr>
                <td><strong>${t('order.notes')}</strong></td>
                <td>${_.escape(order.notes)}</td>
              </tr>
            </table>
          </div>
          <div>
            <table class="table table-striped">
              <tr>
                <th>${t('order.row.product.name')}</th>
                <th>${t('order.row.quantity')}</th>
                <th>${t('order.row.price')}</th>
                <th>${t('order.row.total')}</th>
              </tr>
              ${order.rows.map(row => OrderRow({ row })).join('')}
            </table>
            <hr/>
            <p class="text-right">
              ${t('order.subtotal.with.value', { value: totals.netTotal.toFixed(2) })}
            </p>
            <p class="text-right">
              ${t('order.tax.total.with.value', { value: totals.total.minus(totals.netTotal).toFixed(2) })}
            </p>
            <p class="text-right bold">
              ${t('order.total.with.value', { value: totals.total.toFixed(2) })}
            </p>
          </div>
        </div>`,
      dismissable: true
    }))

    this.html.find('.close').on('click', e => this.onClose(e))
    this.html.find('.btn-save-view').on('click', e => this.onSave(e))

    return this.html
  }

  async onSave (evt) {
    const order = this.store.getState().unprocessedOrders.selected
    const status = this.html.find('[name="onm-edit-pickup-status"]').val()

    if (status !== order.getAttributeValue('pickupStatus')) {
      const notification = ERPLY.Alert(t('order.save.action.text'))

      try {
        await Orders.updatePickupStatus(order, status)
        TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
          order: order,
          status: status
        })

        notification.close()
      } catch (err) {
        Ember.Logger.error(err, err.ctx)
        return void toErrorNotification(
          notification,
          t('order.save.action.error', { error: err.message })
        )
      }
    }

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
}
