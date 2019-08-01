import { Modal } from '../../templates/modal'
import { t } from '../../localization'
import { renderStoredView } from '../../utils/view'
import { Orders } from '../../api/erply/orders'
import { PickupStatus } from '../../constants/pickup-status'
import { flatten } from '../../api/erply/utils'
import { UNPROCESSED_ORDERS_LIST } from '../../constants/templates'
import { pickOrder } from '../../actions/unprocessed-orders'
import { toErrorNotification } from '../../utils/notification'

const OrderEditRow = ({ row }) => (
  `<tr data-row-id="${row.rowID}">
    <td>${_.escape(row.code)}</td>
    <td>${_.escape(row.itemName)}</td>
    <td>
      <input type="text"
        name="onm-order-row-amount"
        class="form-control input-sm"
        value="${_.escape(row.amount)}"/>
    </td>
    <td>
      <button class="btn onm-order-edit-remove-row onm-remove">
        ${t('order.action.remove')}
      </button>
    </td>
  </tr>`
)

export class EditUnprocessedOrder {
  constructor (store) {
    this.store = store
    this.html = $('<div></div>')
  }

  render () {
    const order = this.store.getState().unprocessedOrders.selected

    this.html.off('click')

    this.html = $(Modal({
      id: 'onm-edit-order',
      title: `
        <span id="onm-edit-order-${order.id}">
          ${t('order.edit.title', { number: order.number })}
        </span>`,
      actions: `
        <button type="button" class="btn-save-view bold text-uppercase">
          ${t('order.action.save')}
        </button>
      `,
      body: `
        <table id="onm-edit-order-table" class="table table-white">
          <thead>
            <th>${t('order.row.product.code')}</th>
            <th>${t('order.row.product.name')}</th>
            <th>${t('order.row.quantity')}</th>
            <th>${t('order.edit.actions')}</th>
          </thead>
          <tbody id="onm-order-edit-rows">
            ${order.rows.map(row => OrderEditRow({ row })).join('')}
          </tbody>
        </table>
      `,
      dismissable: true
    }))

    this.html.on('click', '.btn-save-view', e => this.onSave(e))
    this.html.on('click', '.onm-order-edit-remove-row', e => this.onRowRemove(e))

    return this.html
  }

  onRowRemove (evt) {
    const target = $(evt.target)
    const row = target.closest('tr')

    if (row.hasClass('onm-removed')) {
      target.text(t('order.action.remove'))
      row.removeClass('onm-removed')
      row.css({
        'text-decoration': 'none'
      })
    } else {
      target.text(t('order.action.add.back'))
      row.addClass('onm-removed')
      row.css({
        'text-decoration': 'line-through'
      })
    }
  }

  async onSave (evt) {
    const order = this.store.getState().unprocessedOrders.selected

    let removedProducts = []
    let rows = this.html
      .find('[data-row-id]')
      .map(function () {
        let amount

        if ($(this).hasClass('onm-removed')) {
          amount = 0
        } else {
          amount = $(this).find('[name="onm-order-row-amount"]').val()
        }

        const original = _.cloneDeep(order.rows.find(
          row => parseInt(row.rowID) === parseInt($(this).data('row-id'))
        ))

        original.amount = amount

        return original
      })
      .get()
      .filter(row => {
        if (row.amount > 0) {
          return true
        }

        removedProducts.push(row.code)
        return false
      })

    if (removedProducts.length !== 0) {
      let message = t('order.edit.confirmation.plu.remove', {
        pluList: removedProducts.join(', ')
      })

      if (rows.length === 0) {
        message += (' ' + t('order.edit.confirmation.order.cancelled'))
      }

      ERPLY.Confirm({
        title: t('order.edit.confirmation.title'),
        body: message + ' ' + t('order.edit.confirmation.confirmation.text'),
        buttons: ['yes', 'cancel'],
        'on.yes': () => {
          this.saveEditedOrder(rows, order)
        }
      })

      $('#confirmation-modal .modal-content').css({
        'border': '1px solid rgba(0, 0, 0, 0.2)'
      })

      $('#confirmation-modal .button-cancel').css({
        height: '48px'
      })

      $('#confirmation-modal .button-yes').css({
        height: '48px'
      })
    } else {
      await this.saveEditedOrder(rows, order)
    }
  }

  async saveEditedOrder (rows, order) {
    const notification = ERPLY.Alert(t('order.save.action.text'))

    // If no rows are left on the order, cancel it
    if (rows.length === 0) {
      try {
        await Orders.updatePickupStatus(order, PickupStatus.CANCELLED)

        TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
          order: order,
          status: PickupStatus.CANCELLED
        })
      } catch (err) {
        Ember.Logger.error(err, err.ctx)
        return void toErrorNotification(
          notification,
          t('order.save.action.error', { error: err.message })
        )
      }
    } else {
      try {
        await Orders.save(Object.assign({
          id: order.id,
          attributeName0: 'pickupStatus',
          attributeType0: 'text',
          attributeValue0: PickupStatus.PICKED,
          ignoreLocalSQL: true
        }, flatten(rows.map(row => {
          return {
            productID: row.productID,
            amount: row.amount
          }
        }))))

        this.store.dispatch(pickOrder(order.id, rows))
      } catch (err) {
        Ember.Logger.error(err, err.ctx)
        return void toErrorNotification(
          notification,
          t('order.save.action.error', { error: err.message })
        )
      }
    }

    notification.close()

    renderStoredView({
      viewType: UNPROCESSED_ORDERS_LIST,
      modal: false,
      dismiss: true
    })
  }

  onClose () {
    renderStoredView({
      viewType: UNPROCESSED_ORDERS_LIST,
      modal: false,
      dismiss: true
    })
  }
}
