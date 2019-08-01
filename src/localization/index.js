import french from '../../locales/fr'
import english from '../../locales/en'
import { PickupStatus } from '../constants/pickup-status'

const localizations = {
  en: english,
  fr: french
}

const erplyPosLanguageCodeMap = {
  eng: 'en',
  lat: 'fr'
}

function erplyLanguageCodeToPos (code) {
  return erplyPosLanguageCodeMap[code] || undefined
}

/**
 * Translates text to current locale
 * @param {string} text
 * @returns {string}
 */
export function t (key, data = {}) {
  const defaultLanguage = erplyLanguageCodeToPos(TSPOS.Model.Config.data.default_language) || 'en'
  let locale = TSPOS.Model.POS.getCurrentLanguage() || defaultLanguage

  if (!localizations.hasOwnProperty(locale)) {
    locale = 'en'
  }

  return substitute(localizations[locale][key] || localizations['en'][key] || key, data)
}

export function getPickupStatusKey (pickupStatus) {
  switch (pickupStatus) {
    case PickupStatus.NEW:
      return 'order.pickup.status.new'
    case PickupStatus.PICKING:
      return 'order.pickup.status.picking'
    case PickupStatus.PICKED:
      return 'order.pickup.status.picked'
    case PickupStatus.CONFIRMED:
      return 'order.pickup.status.confirmed'
    case PickupStatus.DELIVERED:
      return 'order.pickup.status.delivered'
    case PickupStatus.CANCELLED:
      return 'order.pickup.status.cancelled'
    default:
      return ''
  }
}

function substitute (str, data) {
  if (Object.keys(data).length === 0) {
    return str
  }

  return str.replace(/({([^}]+)})/g, i => {
    const key = i.replace(/{/, '').replace(/}/, '')

    return data[key] || ''
  })
}
