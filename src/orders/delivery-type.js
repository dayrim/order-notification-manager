import { t } from '../localization'

export function getDeliveryType (order) {
  if (order.type === 'CASHINVOICE') {
    if (typeof order.paymentTypeInfo === 'undefined') {
      return 'UNKNOWN'
    }

    return order.paymentTypeInfo.name
  }

  return t('customer')
}

export function isDeliveryCompanyOrder (order) {
  return (
    order.type === 'CASHINVOICE' &&
    order.getAttributeValue('deliveryDateTime')
  )
}

export function isOnmOrder (documentModel) {
  if (Object.keys(documentModel.dataSalesDocument).length === 0) {
    return false
  }

  if (documentModel.dataSalesDocument.id !== documentModel.orderID) {
    return false
  }

  return documentModel.dataSalesDocument.getAttributeValue('pickupStatus')
}

export function isCreditInvoiceRequest (request) {
  return (
    typeof request.requestName !== 'undefined' &&
    typeof request.type !== 'undefined' &&
    request.requestName === 'saveSalesDocument' &&
    request.type === 'CREDITINVOICE'
  )
}
