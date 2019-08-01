import { isDeliveryCompanyOrder } from '../orders/delivery-type'

export async function onDocumentReturnSaveAction (id) {
  const document = (await ErplyAPI.getSalesDocuments({
    id: id
  })).getFirstRecord()

  if (isDeliveryCompanyOrder(document)) {
    document.payments = _.cloneDeep(TSPOS.Model.Document.dataPayments)

    window.onm.cashInvoiceReturn.document = document
  }
}
