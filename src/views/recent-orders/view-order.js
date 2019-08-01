import Big from 'big.js'
import { Modal } from '../../templates/modal'
import { t, getPickupStatusKey } from '../../localization'
import { getDeliveryType } from '../../orders/delivery-type'
import { pricesDisplayedWithTax } from '../../utils/config'
import { getOrderDateTime } from '../../utils/date'
import { calculateDocumentTotals } from '../../utils/document'

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

export const ViewRecentOrder = ({ order }) => {
  const totals = calculateDocumentTotals(order)
  const content = $(Modal({
    id: 'onm-view-recent-order',
    title: `<span>${t('order.with.number', { number: order.number })}</span>`,
    body: `<div>
      <div>
        <table class="table table-white table-customer">
          <tr>
            <td><strong>${t('order.number')}</strong></td>
            <td>${_.escape(order.number)}</td>
          </tr>
          <tr>
            <td><strong>${t('order.pickup.type')}</strong></td>
            <td>${_.escape(getDeliveryType(order))}</td>
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
              ${_.escape(t(getPickupStatusKey(order.getAttributeValue('pickupStatus'))))}
            </td>
          </tr>
          <tr>
            <td><strong>${t('order.return.documents')}</strong></td>
            <td>${_.escape(order.getAttributeValue('returnDocumentNumbers') || '')}</td>
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

  return content
}
