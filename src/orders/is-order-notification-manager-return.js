import { isCreditInvoiceRequest } from './delivery-type'

export function isOrderReturnRequest (requests) {
  return requests.filter(
    request => (
      isCreditInvoiceRequest(request) &&
      request.creditToDocumentID === window.onm.cashInvoiceReturn.document.id
    )
  ).length > 0
}
