// Code copied from how POS handles pickup orders
export function initOrderModel (order) {
  TSPOS.Model.Document.init()
  TSPOS.Model.Document.preventApplyPromotions = true
  TSPOS.Model.Customer.id = order.clientID
  TSPOS.Model.Customer.name = order.clientName
  TSPOS.Model.Customer.email = order.clientEmail
  TSPOS.Model.Document.number = order.number
  TSPOS.Model.Customer.setCustomerNameInfo(order.clientName)
  TSPOS.Model.Customer.setCustomerEmailInfo(order.clientEmail)
  TSPOS.Model.Customer.getAndSetCustomer(order.clientID)
  TSPOS.Model.Document.warehouseID = order.warehouseID
  TSPOS.Model.Document.notes = order.notes
  TSPOS.Model.Document.internalNotes = order.internalNotes
  TSPOS.Model.Document.orderID = order.id
  TSPOS.Model.Document.dataSalesDocument = order // Store order info, POS does not do it by default

  if (order.paid > 0) {
    TSPOS.Model.Document.orderPaid = parseFloat(order.paid)
  }

  TSPOS.Model.Document.employeeID = order.employeeID

  if (TSPOS.Model.Document.notes.length > 0 || TSPOS.Model.Document.internalNotes.length > 0) {
    TSPOS.UI.setUIFlag('[data-function="document-notes"]', true)
  }

  TSPOS.Model.Document.taxExemptCertificateNumber = order.taxExemptCertificateNumber

  if (TSPOS.Model.Document.taxExemptCertificateNumber.length > 0) {
    TSPOS.UI.setUIFlag('[data-function="tax-exempt"]', true)
  }

  TSPOS.Model.Document.APIFieldsCompat(order)
  TSPOS.Model.Document.filterContainers(order.rows)

  const rows = order.rows.map(row => {
    if (row._isContainer || TSPOS.Model.Config.getBoolean('touchpos_order_pickup_recalculates_prices')) {
      row.manualDiscount = 0
    }

    TSPOS.Model.Document.addProduct(row)

    return row.productID
  })

  TSPOS.Model.Document.queueApplyPromotions()
  TSPOS.Model.Document.preventApplyPromotions = false
  TSPOS.Model.Document.getProductsDataOnExistingDocument(rows)
}
