export const Modal = ({ id, title = '', body = '', actions = '', footer = '', dismissable = true, style = '' }) => (
  `<div class="modal" id="${id}">
    <div class="modal-dialog" style="${style}">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-header-title text-24px">${title}</span>
          ${dismissable ? `
            <div class="modal-actions pull-right" style="padding-right: 12px;">
              ${actions}
              <button type="button" class="close">&times;</button>
            </div>` : ``}
        </div>
        <div class="modal-body scrollable">
          ${body}
        </div>
        ${footer.length > 0 ? `<div class="modal-footer" style="margin-top: 0px;">
            ${footer}
          </div>` : ``}
      </div>
    </div>
  </div>`
)
