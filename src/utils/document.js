import Big from 'big.js'

export function calculateDocumentTotals (document) {
  return document.rows.reduce((totals, row) => {
    const netPrice = new Big(row.finalNetPrice).times(new Big(row.amount))
    const priceWithVat = new Big(row.finalPriceWithVAT).times(new Big(row.amount))

    totals.netTotal = totals.netTotal.plus(netPrice)
    totals.total = totals.total.plus(priceWithVat)

    return totals
  }, {
    netTotal: new Big(0.0),
    total: new Big(0.0)
  })
}
