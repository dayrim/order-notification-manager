import { promisify } from '../../utils/promise'
import { CustomError } from '../../utils/custom-error'
import { t } from '../../localization'

class ErplyApiError extends CustomError {
  constructor (code, status, parameters = {}) {
    super(code)

    this.code = status.errorCode
    this.ctx = {
      status,
      parameters
    }
  }
}

class NetworkError extends ErplyApiError {
  constructor (status, parameters) {
    super(t('erply.api.network.error'), status, parameters)
  }
}

export const ErplyApi = {
  /**
   * Sends a request to Erply API
   * @param {string} request
   * @param {Object} parameters
   * @returns {Promise<HTTP_Result>}
   */
  async sendRequest (request, parameters = {}) {
    parameters.request = request

    return promisify(ErplyAPI.request(request, parameters))
      .then(response => response)
      .catch(err => {
        if (!err.networkConnected()) {
          return Promise.reject(new NetworkError(err.getResponseObject().status, parameters))
        }

        const status = err.getResponseObject().status

        return Promise.reject(new ErplyApiError(status.errorCode, status, parameters))
      })
  },
  /**
   * Find the first record in Erply API
   * @param {string} request
   * @param {Object} parameters
   * @returns {Promise<Object>}
   */
  async find (request, parameters = {}) {
    return ErplyApi.sendRequest(request, parameters)
      .then(response => response.getFirstRecord())
  },
  /**
   * Get all records in Erply API
   * @param {string} request
   * @param {Object} parameters
   * @returns {Promise<HTTP_Result>}
   */
  async all (request, parameters = {}) {
    parameters.pageNo = 1

    let status = {}
    const records = []
    let keepGoing = true

    while (keepGoing) {
      const response = await ErplyApi.sendRequest(request, parameters)
      const object = await response.getResponseObject()

      status = await object.status
      await records.push.apply(records, object.records)

      parameters.pageNo++

      if (object.status.recordsTotal <= records.length || parseInt(object.status.recordsInResponse) === 0) {
        keepGoing = false

        return new HTTP_Result({ status, records })
      }
    }
  }
}
