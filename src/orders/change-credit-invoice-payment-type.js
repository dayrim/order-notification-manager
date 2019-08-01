export function changeCreditInvoicePaymentType (requests) {
  for (const request of requests) {
    if (request.requestName === 'saveSalesDocument') {
      delete request.paymentType
      delete request.pointOfSaleID

      request.paymentTypeID = window.onm.cashInvoiceReturn.document.paymentTypeID
    } else if (request.requestName === 'savePayment') {
      delete request.cashChange
      delete request.cashPaid
      delete request.type

      request.typeID = window.onm.cashInvoiceReturn.document.payments[0].typeID
    }
  }
}
