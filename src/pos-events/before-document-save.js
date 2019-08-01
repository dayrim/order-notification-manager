import { isOrderReturnRequest } from '../orders/is-order-notification-manager-return'
import { changeCreditInvoicePaymentType } from '../orders/change-credit-invoice-payment-type'
import { Orders } from '../api/erply/orders'
import { PickupStatus } from '../constants/pickup-status'
import { store } from '../store'
import { pickOrder } from '../actions/unprocessed-orders'
import { isOnmOrder } from '../orders/delivery-type'

/**
 * CASHINVOICE order return payment type must match the original payment type
 * Add the return document number to the original document as an attribute
 * @param {Array} requests
 */
export async function onBeforeDocumentSave (requests) {
  window.onm.currentDocument = TSPOS.Model.Document

  const cashInvoice = window.onm.cashInvoiceReturn.document

  if (cashInvoice !== null && isOrderReturnRequest(requests)) {
    changeCreditInvoicePaymentType(requests)

    let currentReturnDocuments = cashInvoice.getAttributeValue('returnDocumentNumbers')
    const creditInvoiceNr = requests.find(
      request => request.requestName === 'saveSalesDocument'
    ).invoiceNo + 'K'

    if (!currentReturnDocuments) {
      currentReturnDocuments = creditInvoiceNr
    } else {
      currentReturnDocuments += (',' + creditInvoiceNr)
    }

    try {
      await Orders.save({
        id: cashInvoice.id,
        ignoreLocalSQL: true,
        attributeName0: 'pickupStatus',
        attributeType0: 'text',
        attributeValue0: PickupStatus.PICKED,
        attributeName1: 'returnDocumentNumbers',
        attributeType1: 'text',
        attributeValue1: currentReturnDocuments
      })

      const saved = await Orders.find(cashInvoice.id, {})

      store.dispatch(pickOrder(saved.id, saved.rows))

      TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
        order: saved,
        status: PickupStatus.PICKED
      })
    } catch (err) {
      Ember.Logger.error(err, err.ctx)
    }
  }

  // If someone has saved an order as a sales document for later, complete the order
  const saveSalesDocumentRequest = requests.find(request => {
    return request.requestName === 'saveSalesDocument' &&
      request.hasOwnProperty('baseDocumentID') &&
      request.baseDocumentID === TSPOS.Model.Document.dataSalesDocument.id &&
      (typeof request.deleted === 'undefined' || request.deleted === 0) &&
      isOnmOrder(TSPOS.Model.Document)
  })

  if (saveSalesDocumentRequest && !requests.find(request => request.requestName === 'savePayment')) {
    requests.push({
      requestName: 'saveSalesDocument',
      id: TSPOS.Model.Document.dataSalesDocument.id,
      attributeName0: 'pickupProcessed',
      attributeType0: 'int',
      attributeValue0: 1,
      attributeName1: 'pickupStatus',
      attributeType1: 'text',
      attributeValue1: PickupStatus.DELIVERED
    })

    TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
      order: TSPOS.Model.Document.dataSalesDocument,
      status: PickupStatus.DELIVERED
    })
  }

  Ember.Logger.log(requests)
}
