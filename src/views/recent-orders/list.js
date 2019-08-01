import { Modal } from '../../templates/modal'
import { t } from '../../localization'
import { getDeliveryType } from '../../orders/delivery-type'
import { renderStoredView, renderView } from '../../utils/view'
import { ViewRecentOrder } from './view-order'
import { UNPROCESSED_ORDERS_LIST, VIEW_FINISHED_ORDER, FINISHED_ORDERS_LIST } from '../../constants/templates'
import { ErplyApi } from '../../api/erply/api'
import { toErrorNotification } from '../../utils/notification'
import { getOrderDateTime } from '../../utils/date'

/**
 * @param {Object} params
 * @param {Object} params.order
 * @returns {string}
 */
const RecentOrderRow = ({ order }) => {
  return `<tr data-id="${order.id}" style="cursor: default;">
    <td class="onm-history-view-order pointer" style="text-decoration: underline;">${_.escape(order.number)}</td>
    <td>${_.escape(order.date)}</td>
    <td>${_.escape(getOrderDateTime(order.getAttributeValue('pickupDateTime')))}</td>
    <td>${_.escape(order.clientName)}</td>
    <td>${_.escape(getDeliveryType(order))}</td>
    <td class="recent-order-print" style="text-align: center; color: #999; cursor: pointer;">
      <i class="icon_printer text-24px onm-print-recent-order"></i>
    </td>
  </tr>`
}

/**
 * Creates a new recent orders template
 * @param {Object} params
 * @param {Object[]} params.orders
 * @returns {string}
 */
export const RecentOrdersList = ({ orders }) => {
  const content = $(Modal({
    id: 'onm-recent-orders',
    title: t('orders.list.title'),
    body: `
      <div class="toggle-button-actions">
        <div>
          <button type="button" style="width:50%!important" class="btn btn-transparent bold" id="onm-current-button">
            ${t('orders.tab.unfinished')}
          </button>
          <button type="button" style="width:50%!important" class="btn bold btn-transparent active" id="onm-history-button">
            ${t('orders.tab.history')}
          </button>
        </div>
      </div>
      <table id="onm-recent-orders-table" class="table table-white">
        <thead>
          <tr>
            <th data-sort="int">${t('order.number')}</th>
            <th data-sort="string">${t('order.date.created')}</th>
            <th data-sort="string">${t('order.pickup.date.time')}</th>
            <th data-sort="string">${t('customer')}</th>
            <th data-sort="string">${t('order.pickup.type')}</th>
            <th>${t('order.action.heading')}</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => RecentOrderRow({ order })).join('')}
        </tbody>
      </table>
    `
  }))

  content.addClass('customer-add-modal')
  content.find('.recent-order-print').hover(function () {
    $(this).css({ color: 'black' })
  }, function () {
    $(this).css({ color: '#999' })
  })

  const handlePrint = async evt => {
    const id = $(evt.target).closest('tr').data('id')
    const order = orders.find(order => parseInt(order.id) === parseInt(id))

    const notification = ERPLY.Alert(t('order.print.action.progress'))

    if (order.type === 'ORDER') {
      const receiptIds = order.followUpDocuments.map(receipt => receipt.id)

      if (receiptIds.length === 0) {
        return void toErrorNotification(notification, t('order.print.receipts.missing'))
      }

      let receipts

      try {
        receipts = (await ErplyApi.sendRequest('getSalesDocuments', {
          ids: receiptIds.join(',')
        })).getRecords()
      } catch (err) {
        return void toErrorNotification(notification, t('order.print.receipts.fetch.error'))
      }

      try {
        receipts.forEach(receipt => TSPOS.Print.printData({
          url: receipt.invoiceLink,
          payload: {
            warehouseName: receipt.warehouseName,
            warehouseID: receipt.warehouseID,
            posName: receipt.pointOfSaleName || TSPOS.Model.POS.name,
            invoiceNo: receipt.number,
            type: receipt.type,
            documentType: receipt.type,
            customerName: receipt.clientName,
            customerID: receipt.clientID,
            customerCardNumber: receipt.clientCardNumber,
            employeeName: receipt.employeeName,
            notes: receipt.notes,
            items: receipt.rows,
            dateTime: receipt.date + ' ' + receipt.time,
            netTotal: receipt.netTotal,
            total: receipt.total
          }
        }))
      } catch (err) {
        Ember.Logger.error(err)
        return void toErrorNotification(notification, t('order.print.action.failure'))
      }
    } else {
      try {
        TSPOS.Print.printData({
          url: order.invoiceLink,
          payload: {
            warehouseName: order.warehouseName,
            warehouseID: order.warehouseID,
            posName: order.pointOfSaleName,
            invoiceNo: order.number,
            type: order.type,
            customerName: order.clientName,
            customerID: order.clientID,
            customerCardNumber: order.clientCardNumber,
            employeeName: order.employeeName,
            notes: order.notes,
            items: order.rows,
            dateTime: order.date + ' ' + order.time,
            netTotal: order.netTotal,
            total: order.total
          }
        })
      } catch (err) {
        Ember.Logger.error(err)
        return void toErrorNotification(notification, t('order.print.action.failure'))
      }
    }

    notification.delayedClose(2.5)
  }

  const handleCurrentClick = () => {
    renderStoredView({
      viewType: UNPROCESSED_ORDERS_LIST,
      modal: false,
      dismiss: false
    })
  }

  const handleNumberClick = evt => {
    const id = $(evt.target).closest('tr').data('id')
    const order = orders.find(order => parseInt(order.id) === parseInt(id))

    const view = renderView({
      viewType: VIEW_FINISHED_ORDER,
      dismiss: false,
      modal: false,
      content: ViewRecentOrder({ order })
    })

    view.on('close', async () => {
      renderView({
        viewType: FINISHED_ORDERS_LIST,
        dismiss: true,
        modal: false,
        content: RecentOrdersList({
          orders
        })
      })
    })
  }

  content.find('.onm-print-recent-order').on('click', handlePrint)
  content.find('#onm-current-button').on('click', handleCurrentClick)
  content.find('.onm-history-view-order').on('click', handleNumberClick)
  content.find('#onm-recent-orders-table').stupidtable()

  return content
}
