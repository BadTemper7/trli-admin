function decorateTable(table) {
  if (!table || table.matches?.('[data-no-mobile-cards]')) return
  table.classList.add('responsive-table')
  const headers = [...table.querySelectorAll('thead th')].map((node) => node.textContent?.trim() || '')
  table.querySelectorAll('tbody tr').forEach((row) => {
    ;[...row.children].forEach((cell, index) => {
      if (cell.tagName === 'TD' && headers[index]) cell.dataset.label = headers[index]
    })
  })
}

export function installResponsiveTables() {
  const decorate = (root = document) => {
    if (root.matches?.('table')) decorateTable(root)
    root.querySelectorAll?.('table:not([data-no-mobile-cards])').forEach(decorateTable)
    const closestTable = root.closest?.('table:not([data-no-mobile-cards])')
    if (closestTable) decorateTable(closestTable)
  }
  if (!document.body) return () => {}
  decorate()
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      decorate(record.target)
      record.addedNodes.forEach((node) => { if (node.nodeType === 1) decorate(node) })
    })
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  return () => observer.disconnect()
}
