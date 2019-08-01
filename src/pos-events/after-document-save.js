import { isOnmOrder } from '../orders/delivery-type'
import { Orders } from '../api/erply/orders'
import { PickupStatus } from '../constants/pickup-status'

/**
 * Orders have attributes pickupProcessed and pickupStatus that also need to be
 * changed when paying for the order. Cannot add more requests to
 * before_document_save array because POS will try to print all saveSalesDocument
 * calls. Cannot save before either as bulk API call will fail then.
 **/
export async function onAfterDocumentSave () {
  const document = window.onm.currentDocument

  if (isOnmOrder(document)) {
    /* POS will also send a request to complete the order that is not available
       in beforeDocumentSave, need to add attributes.
       API fails to handle the request for some reason if two saveSalesDocument
       calls are sent about the same time hence the setTimeout */
    setTimeout(async () => {
      try {
        await Orders.updatePickupStatus(document.dataSalesDocument, PickupStatus.DELIVERED)

        TSPOS.EventManager.runEventListener('onm_after_order_status_update', {
          order: document.dataSalesDocument,
          status: PickupStatus.DELIVERED
        })
      } catch (err) {
        Ember.Logger.error(err, err.ctx)
      }
    }, 500)
  }
}
