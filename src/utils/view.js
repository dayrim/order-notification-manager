export function renderStoredView (params) {
  Template[params.viewType] = window.onm.views[params.viewType].render()

  const view = TSPOS.UI.openView(params)

  view.on('close', window.onm.views[params.viewType].onClose || (() => { TSPOS.UI.closeCurrentView() }))

  return view
}

export function isViewOpen (name) {
  const result = TSPOS.UI.openViews
    .find(view => view.originalParams.viewType === name)

  if (result) {
    return true
  }

  return false
}

/**
 * Adds a new template and renders it
 * @param {Object} viewParams
 * @returns {Object}
 */
export function renderView (viewParams) {
  Template[viewParams.viewType] = viewParams.content

  return TSPOS.UI.openView(viewParams)
}
