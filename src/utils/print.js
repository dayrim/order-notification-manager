export function printHtml (html) {
  const printWindow = window.open()

  printWindow.opener = null
  printWindow.document.write(html)

  printWindow.focus()
  printWindow.print()
  printWindow.close()
}
