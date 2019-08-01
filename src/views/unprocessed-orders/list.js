import { Modal } from '../../templates/modal'
import { t, getPickupStatusKey } from '../../localization'
import { renderStoredView, renderView, isViewOpen } from '../../utils/view'
import { getDeliveryType } from '../../orders/delivery-type'
import { getActionTextForStatus } from '../../orders/pickup-status'
import { PickupStatus } from '../../constants/pickup-status'
import { Orders } from '../../api/erply/orders'
import { initOrderModel } from '../../orders/init-order-model'
import { PrintTemplate } from '../../templates/print-template'
import { printHtml } from '../../utils/print'
import { RecentOrdersList } from '../recent-orders/list'
import { VIEW_UNPROCESSED_ORDER, PICKING_CONFIRMATION, FINISHED_ORDERS_LIST, UNPROCESSED_ORDERS_LIST } from '../../constants/templates'
import { updateOrders, selectOrder, updateOrderStatus } from '../../actions/unprocessed-orders'
import { toErrorNotification } from '../../utils/notification'
import { getOrderDateTime } from '../../utils/date'
import { ErplyApi } from '../../api/erply/api'

export class UnprocessedOrdersList {
  constructor (store) {
    this.store = store
    this.html = $(Modal({
      id: 'order-notifications-unprocessed-orders',
      title: t('orders.list.title'),
      actions: `
        <button type="button" class="btn-save-view bold text-uppercase" id="onm-refresh-button">
          ${t('orders.list.refresh.button')}
        </button>
      `,
      body: `
      <table id="onm-unfulfilled-orders-table" class="table table-white">
        <thead>
          <tr>
            <th data-sort="int">${t('order.number')}</th>
            <th data-sort="string">${t('order.pickup.date.time')}</th>
            <th data-sort="string">${t('customer')}</th>
            <th data-sort="string">${t('order.status')}</th>
            <th data-sort="string">${t('order.pickup.type')}</th>
            <th data-sort="string">${t('order.action.heading')}</th>
          </tr>
         </thead>
        <tbody id="onm-unfulfilled-orders">
        </tbody>
      </table>`
    }))

    this.html.addClass('customer-add-modal')
    this.sortedIndex = 0
    this.sortingDirection = 'desc'

    TSPOS.EventManager.addEventListener('onm_after_orders_update', () => {
      if (isViewOpen(UNPROCESSED_ORDERS_LIST)) {
        this.render()
      }
    })
  }

  render () {
    const body = this.html.find('.modal-body')
    const state = this.store.getState()
    const orders = state.unprocessedOrders.orders

    const header = $(`
      <span class="modal-header-title text-24px">${t('orders.list.title')}</span>
      <div class="modal-actions pull-right">
        <button type="button" class="btn-save-view bold text-uppercase" id="onm-refresh-button">
          ${t('orders.list.refresh.button')}
        </button>
        <button type="button" class="close">×</button>
      </div>
    `)

    this.html.find('.modal-header').html(header)

    const table = $(`
    <div class="toggle-button-actions">
      <div>
        <button type="button" style="width:50%!important" class="btn btn-transparent bold active">
          ${t('orders.tab.unfinished')}
        </button>
        <button type="button" style="width:50%!important" class="btn bold btn-transparent" id="onm-history-button">
          ${t('orders.tab.history')}
        </button>
      </div>
    </div>
      <table id="onm-unfulfilled-orders-table" class="table table-white">
        <thead>
          <tr>
            <th data-sort="int">${t('order.number')}</th>
            <th data-sort="string">${t('order.pickup.date.time')}</th>
            <th data-sort="string">${t('customer')}</th>
            <th data-sort="string">${t('order.status')}</th>
            <th data-sort="string">${t('order.pickup.type')}</th>
            <th data-sort="string">${t('order.action.heading')}</th>
          </tr>
        </thead>
        <tbody id="onm-unfulfilled-orders">
          ${orders.map(order => `
          <tr data-order-id="${order.id}" style="cursor: default;">
            <td class="onm-view-order pointer" style="text-decoration: underline;">${order.number}</td>
            <td>${getOrderDateTime(order.getAttributeValue('pickupDateTime'))}</td>
            <td>${order.clientName}</td>
            <td>${t(getPickupStatusKey(order.getAttributeValue('pickupStatus')))}</td>
            <td>${getDeliveryType(order)}</td>
            <td>
              <button type="button" class="btn onm-table-action" style="white-space: normal; max-width: 110px;">
                ${t(getActionTextForStatus(order.getAttributeValue('pickupStatus')))}
              </button>
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    `)

    table.find('thead th').eq(this.sortedIndex).attr('data-sort-onload', 'yes')
    table.find('thead th').eq(this.sortedIndex).attr('data-sort-default', this.sortingDirection)

    table.bind('aftertablesort', (evt, data) => {
      this.sortedIndex = data.column
      this.sortingDirection = data.direction
    })

    table.stupidtable()

    $('body').off('click', '.onm-view-order')
    $('body').off('click', '.onm-table-action')
    $('body').off('click', '#onm-refresh-button')
    $('body').off('click', '#onm-history-button')

    $('body').on('click', '.onm-view-order', this.handleRowClick.bind(this))
    $('body').on('click', '.onm-table-action', this.handleActionClick.bind(this))
    $('body').on('click', '#onm-refresh-button', this.refreshList.bind(this))
    $('body').on('click', '#onm-history-button', this.handleHistoryClick.bind(this))

    body.html(table)

    return this.html
  }

  async handleHistoryClick (evt) {
    let orders = []

    const notification = ERPLY.Alert(t('orders.fetch.recent.orders'))

    try {
      orders = await Orders.getRecentOrders({
        orderBy: 'lastChanged',
        orderByDir: 'desc',
        getCustomerInformation: 1,
        recordsOnPage: 20
      })
    } catch (err) {
      Ember.Logger.error(err, err.ctx)
      return void toErrorNotification(
        notification,
        t('orders.fetch.recent.orders.error', { error: err.message })
      )
    }

    notification.close()

    renderView({
      viewType: FINISHED_ORDERS_LIST,
      dismiss: true,
      modal: false,
      content: RecentOrdersList({
        orders
      })
    })
  }

  handleRowClick (evt) {
    const id = $(evt.target).closest('tr').data('order-id')

    this.store.dispatch(selectOrder(id))

    renderStoredView({
      viewType: VIEW_UNPROCESSED_ORDER,
      dismiss: true,
      modal: false
    })
  }

  async refreshList () {
    const notification = ERPLY.Alert(t('orders.fetch.unprocessed.orders'))

    let response

    try {
      response = await Orders.all({
        warehouseID: TSPOS.Model.POS.selectedWarehouseID,
        confirmed: 1,
        searchAttributeName0: 'pickupProcessed',
        searchAttributeValue0: 0
      })

      this.store.dispatch(updateOrders(response.getRecords()))

      TSPOS.EventManager.runEventListener('onm_after_orders_update', {
        orders: response.getRecords()
      })
    } catch (err) {
      Ember.Logger.error(err, err.ctx)
      return void toErrorNotification(
        notification,
        t('orders.fetch.unprocessed.orders.error', { error: err.message })
      )
    }

    notification.close()
  }

  async handleActionClick (evt) {
    const id = $(evt.target).closest('tr').data('order-id')
    const order = this.store.getState().unprocessedOrders.orders.find(order => parseInt(order.id) === parseInt(id))

    switch (order.getAttributeValue('pickupStatus')) {
      case PickupStatus.NEW:
        await this.printPickingList(order)
        break
      case PickupStatus.PICKING:
        await this.finishPicking(order)
        break
      case PickupStatus.PICKED:
        await this.confirmOrder(order)
        break
      case PickupStatus.CANCELLED:
        await this.moveCancelledOrderToHistory(order)
        break
    }
  }

  async printPickingList (order) {
    // const customerInfo = (await ErplyApi.sendRequest('getCustomers', {
    //   customerID: order.clientID
    // })).getFirstRecord()

    const notification = ERPLY.Alert(t('order.print.generate'))

    try {
      printHtml(PrintTemplate({ order }))
    } catch (err) {
      Ember.Logger.error(err)
      return void toErrorNotification(notification, t('order.print.generate.error'))
    }

    notification.setMessage(t('order.save.action.text'))

    try {
      await Orders.updatePickupStatus(order, PickupStatus.PICKING)
      TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
        order: order,
        status: PickupStatus.PICKING
      })

      notification.close()
    } catch (err) {
      Ember.Logger.error(err, err.ctx)
      toErrorNotification(
        notification,
        t('order.save.action.error', { error: err.message })
      )
    }

    notification.close()
  }

  async finishPicking (order) {
    this.store.dispatch(selectOrder(order.id))

    renderStoredView({
      viewType: PICKING_CONFIRMATION,
      dismiss: true,
      modal: true
    })
  }

  async confirmOrder (order) {
    // Client needs to pay for an order, CASHINVOICE has already been paid for
    if (order.type === 'ORDER') {
      initOrderModel(order)
      TSPOS.UI.closeCurrentView()
      $('#button-return').addClass('hidden')
      $('#button-nosale').removeClass('hidden')
    } else {
      const notification = ERPLY.Alert(t('order.save.action.text'))

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
        await Orders.updatePickupStatus(order, PickupStatus.CONFIRMED)
        TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
          order: order,
          status: PickupStatus.CONFIRMED
        })
      } catch (err) {
        Ember.Logger.error(err, err.ctx)
        return void toErrorNotification(
          notification,
          t('order.save.action.error', { error: err.message })
        )
      }

      notification.close()
    }
  }
  async moveCancelledOrderToHistory (order) {
    const notification = ERPLY.Alert(t('order.save.action.text'))

    try {
      await Orders.save({
        id: order.id,
        attributeName0: 'pickupProcessed',
        attributeType0: 'int',
        attributeValue0: 1,
        ignoreLocalSQL: true
      })

      this.store.dispatch(updateOrderStatus(order.id, PickupStatus.CANCELLED))

      TSPOS.EventManager.runEventListener('onm_after_orders_update', {
        orders: this.store.getState().unprocessedOrders.orders
      })
    } catch (err) {
      Ember.Logger.error(err, err.ctx)
      return void toErrorNotification(
        notification,
        t('order.save.action.error', { error: err.message })
      )
    }

    notification.close()
  }
}
