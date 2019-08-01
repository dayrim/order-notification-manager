import { t } from '../localization'
import { getOrderDateTime } from '../utils/date'
import { pricesDisplayedWithTax } from '../utils/config'
import { getDeliveryType } from '../orders/delivery-type'

export const PrintTemplate = ({ order }) => {
  // const phoneNumbers = []

  // if (customerInfo.mobile) {
  //   phoneNumbers.push(customerInfo.mobile)
  // }

  // if (customerInfo.phone) {
  //   phoneNumbers.push(customerInfo.phone)
  // }

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${t('order.print.title')}</title>
    <style>
      #page {
        width: 100%;
        margin: 0 auto;
      }

      #order-info th {
        text-align: left;
      }

      #order-info th, #order-info td {
        padding: 6px;
      }

      #products {
        width: 100%;
        border-collapse: collapse;
      }

      #products {
        margin-top: 50px;
      }

      #products th {
        text-align: left;
        border-top: 2px solid black;
        border-bottom: 1px solid black;
      }

      #products td, #products th {
        padding: 8px;
      }
    </style>
  </head>
  <body>
    <div id="page">
      <h2>
        ${t('order.with.number', { number: _.escape(order.number) })} (${getDeliveryType(order)})
      </h2>
      <hr>
      <div>
        <table id="order-info">
          <tbody>
            <tr>
              <th>${t('order.pickup.type')}</th>
              <td>${_.escape(getDeliveryType(order))}</td>
            </tr>
            <tr>
              <th>${t('customer')}</th>
              <td>${_.escape(order.clientName)}</td>
            </tr>
            <tr>
              <th>${t('customer.card.number')}</th>
              <td>${_.escape(order.clientCardNumber)}</td>
            </tr>
            <tr>
              <th>${t('order.date')}</th>
              <td>${_.escape(order.date)}</td>
            </tr>
            <tr>
              <th>${t('order.reference.no')}</th>
              <td>${_.escape(order.referenceNumber)}</td>
            </tr>
            <tr>
              <th>${t('order.pickup.date.time')}</th>
              <td>${_.escape(getOrderDateTime(order.getAttributeValue('pickupDateTime')))}</td>
            </tr>
            <tr>
              <th>${t('order.delivery.date.time')}</th>
              <td>${_.escape(getOrderDateTime(order.getAttributeValue('deliveryDateTime')))}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <table id="products">
        <thead>
          <tr>
            <th>${t('order.row.product.code')}</th>
            <th>${t('order.row.product.description')}</th>
            <th>${t('order.row.price')}</th>
            <th>${t('order.row.quantity')}</th>
          </tr>
        </thead>
        <tbody>
          ${order.rows.map(row => `
            <tr>
              <td>${_.escape(row.code)}</td>
              <td>${_.escape(row.itemName)}</td>
              <td>${_.escape(pricesDisplayedWithTax() ? row.finalPriceWithVAT : row.finalNetPrice)}</td>
              <td>${_.escape(row.amount)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <p>${t('order.print.notes', { notes: _.escape(order.notes) })}</p>
    </div>
  </body>
  </html>
`
}
