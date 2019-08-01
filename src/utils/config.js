export function pricesDisplayedWithTax () {
  return TSPOS.Model.Config.data.locale_uses_price_with_tax || 0
}
