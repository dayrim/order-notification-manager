import { Orders } from './api/erply/orders'
import { updateOrders } from './actions/unprocessed-orders'
import { t } from './localization'

export default class Updater {
  constructor (store) {
    this.store = store
    this.interval = null
    this.timestamp = 0
  }

  async findUnprocessedOrders () {
    let response

    try {
      response = await Orders.all({
        warehouseID: TSPOS.Model.POS.selectedWarehouseID,
        confirmed: 1,
        searchAttributeName0: 'pickupProcessed',
        searchAttributeValue0: 0
      })
    } catch (err) {
      return void Ember.Logger.error(err, err.ctx)
    }

    if (this.timestamp !== 0) {
      const orders = this.store.getState().unprocessedOrders.orders
      const responseOrders = response.getRecords()

      const newOrders = responseOrders.filter(
        responseOrder => !orders.find(order => order.id === responseOrder.id)
      )

      if (newOrders.length !== 0) {
        const dropdownMenu = $('.notification-center .dropdown-menu')
        let rows = ''

        rows = newOrders.map(order => {
          return `
            <li>
              <div class="row">
                <div class="col-md-6">
                  #${order.number}
                </div>
                <div class="col-md-6 text-right">
                  ${parseFloat(order.total).toFixed(2)}
                </div>
              </div>
            </li>
          `
        }).join('')

        if (dropdownMenu.length === 0) {
          $('.notification-center-icon').click()

          const header = `
            <li>
              <span class="bold">${t('orders.update.new.orders')}</span>
            </li>
          `

          $('.notification-center-items').html(header + rows)
        } else {
          $('.notification-center-items').append(rows)
        }
      }
    }

    this.store.dispatch(updateOrders(response.getRecords()))

    TSPOS.EventManager.runEventListener('onm_after_orders_update', {
      orders: response.getRecords()
    })

    this.timestamp = response.getTimestamp()
  }

  /**
   * Starts the updater
   * @param {number} interval
   */
  check (interval) {
    if (!this.interval) {
      this.findUnprocessedOrders()
    }

    this.interval = setInterval(() => this.findUnprocessedOrders(), interval)
  }
}
