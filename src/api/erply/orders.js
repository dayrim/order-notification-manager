import { ErplyApi } from './api'
import { PickupStatus } from '../../constants/pickup-status'

export const Orders = {
  MAX_RECORDS_PER_PAGE: 100,
  /**
   * Find a sales document by id
   * @param {Number} id
   * @param {Object} parameters
   * @returns {Promise<Object>}
   */
  async find (id, parameters = {}) {
    parameters.id = id
    parameters.getCustomerInformation = 1
    parameters.getRowsForAllInvoices = 1
    parameters.nonReturnedItemsOnly = 1

    const [order, invoicePaymentTypes] = await Promise.all([
      ErplyApi.find('getSalesDocuments', parameters),
      ErplyApi.all('getInvoicePaymentTypes').then(response => response.getRecords())
    ])

    const paymentInfo = invoicePaymentTypes.find(
      paymentType => parseInt(paymentType.id) === parseInt(order.paymentTypeID)
    )

    order.paymentTypeInfo = paymentInfo

    return order
  },
  /**
   * Get sales documents
   * @param {Object} parameters
   * @returns {Promise<HTTP_Result>}
   */
  async get (parameters = {}) {
    parameters.types = 'ORDER,CASHINVOICE'
    parameters.getCustomerInformation = 1
    parameters.getRowsForAllInvoices = 1
    parameters.nonReturnedItemsOnly = 1

    return ErplyApi.sendRequest('getSalesDocuments', parameters)
  },
  /**
   * Get all sales documents
   * @param {Object} parameters
   * @returns {Promise<HTTP_Result>}
   */
  async all (parameters = {}) {
    parameters.types = 'ORDER,CASHINVOICE'
    parameters.recordsOnPage = 100
    parameters.getCustomerInformation = 1
    parameters.getRowsForAllInvoices = 1
    parameters.nonReturnedItemsOnly = 1

    let [orders, paymentTypes] = await Promise.all([
      ErplyApi.all('getSalesDocuments', parameters),
      ErplyApi.all('getInvoicePaymentTypes').then(response => response.getRecords())
    ])

    paymentTypes = _.indexBy(paymentTypes, 'id')

    orders.getRecords().forEach(order => {
      order.paymentTypeInfo = paymentTypes[order.paymentTypeID] || undefined
    })

    return orders
  },
  /**
   * Saves a sales document
   * @param {Object} order
   * @returns {Promise<HTTP_Result>}
   */
  async save (order) {
    return ErplyApi.sendRequest('saveSalesDocument', order)
  },

  /**
   * Get orders that have been recently completed
   * @param {Object} parameters
   * @returns {Promise<Object[]>}
   */
  async getRecentOrders (parameters = {}) {
    parameters.orderBy = 'lastChanged'
    parameters.searchAttributeName0 = 'pickupProcessed'
    parameters.searchAttributeValue0 = 1

    let [orders, paymentTypes] = await Promise.all([
      this.get(parameters).then(response => response.getRecords()),
      ErplyApi.all('getInvoicePaymentTypes').then(response => response.getRecords())
    ])

    paymentTypes = _.indexBy(paymentTypes, 'id')

    orders.forEach(order => {
      order.paymentTypeInfo = paymentTypes[order.paymentTypeID]
    })

    return orders
  },

  async updatePickupStatus (order, newStatus) {
    let payload = {
      id: order.id,
      ignoreLocalSQL: true,
      attributeName0: 'pickupStatus',
      attributeType0: 'text',
      attributeValue0: newStatus
    }

    if (
      newStatus === PickupStatus.CONFIRMED ||
      newStatus === PickupStatus.CANCELLED ||
      newStatus === PickupStatus.DELIVERED
    ) {
      payload = {
        ...payload,
        ...{
          attributeName1: 'pickupProcessed',
          attributeType1: 'int',
          attributeValue1: 1
        }
      }
    }

    if (newStatus === PickupStatus.CANCELLED && order.type === 'ORDER') {
      payload.invoiceState = 'CANCELLED'
    }

    return Orders.save(payload)
  }
}
