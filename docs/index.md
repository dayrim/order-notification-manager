# Orders

There are two type of orders:

* Customer comes to pick up the order themselves (Customer pickup)
* A delivery company will come to pick up the order and deliver it (Delivery company pickup)

An order is a sales document that is created in either back-office or by a
saveSalesDocument API call. Pre-payments are not allowed for orders. A valid
order must have the following attributes attached:

* pickupProcessed (value: 0 or 1; type: int) - Indicates whether this order has been completed. It is used to populate the unfinished orders view. Orders with value 1 are available in history.
* pickupStatus (value: NEW, PICKING, PICKED, CONFIRMED, DELIVERED, CANCELLED; type: text) - Current status of the pickup order
* pickupDateTime (type: Y-m-d H:i:s datetime) - UTC time when the customer/delivery company will come to pick up the order.
* deliveryDateTime (type: Y-m-d H:i:s datetime) - UTC time when the customer must receive the finished order.

The pickupDateTime and deliveryDateTime must be converted to the local time zone
when displaying it in the UI. Information about current account's time zone can
be found in either under the warehouse data or the account's configuration.

## Delivery Company Order

Delivery company orders are sales documents with type=CASHINVOICE. Delivery
company orders have already been paid and must therefore have a payment attached
to it with a delivery company payment type. This information can be found in
the sales document field paymentTypeID. To retrieve the name of the payment type
getInvoicePaymentTypes can be used. If this field is absent then the CASHINVOICE
cannot be considered a valid delivery company order.

A credit invoice is created when an employee removes products during the picking
phase. The credit invoice's payment type must match the CASHINVOICE's payment
type. Credit invoice creation is handled by standard POS return flow. After a
credit invoice has been made the number is saved

## Customer Pickup Orders

Customer pickup type orders are sales documents with type=ORDER. Customer pickup
orders are unpaid.

When removing/adding products during the picking phase the existing order is
modified.

Once the customer comes to pick up the order, a payment will be initialized
using standard POS payment flow.

## Pickup Statuses

* NEW - This should be the status for newly created orders
* PICKING - An employee has printed out the picking list
* PICKED - Employee has finished picking the order and has removed products that
cannot be fulfilled if any.
* CONFIRMED - The order has been passed to the delivery company. Used only by delivery company orders
* DELIVERED - The order has been passed to the customer
* CANCELLED - The order has been cancelled

# Application flow

1. A customer makes an order via a delivery company
2. A sales document (CASHINVOICE) is put into Erply with NEW pickupStatus
3. Employee presses start picking in the UI. Order will be printed out and
   the pickupStatus will be set to PICKING.
4. Employee presses finish picking in the UI. A popup will display whether
   all products could be delivered.
    1. On yes, the popup is closed and the pickup status will be set to PICKED
    2. On no, the popup is closed. For customer orders (type=ORDER), a view is
       opened where the employee can remove products from the order. Once save
       is pressed the pickup status will be set to PICKED and the order will be
       updated.

       For delivery company orders (type=CASHINVOICE), a credit invoice will
       be created using standard POS return flow. After the credit invoice
       has been completed, the pickup status will be set to PICKED. The credit
       invoice number will be saved as an attribute to the original document.
5. Delivery company/customer comes to pick up the order. Employee presses confirm
   order button. For delivery company orders the receipt will be printed out and
   the pickup status will be set to CONFIRMED, pickup processed to 1. For
   customer orders, the customer must pay for the order and after payment the
   pickup status will be set to DELIVERED and pickup processed to 1.

Orders are checked for every minute. On new orders a notification will be shown. If there are currently orders with a pickup status NEW, then the orders button will turn red, otherwise it is colored white. The employee can manually refresh the orders in the unfinished orders view.
