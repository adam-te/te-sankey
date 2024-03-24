import { SankeyColumn } from "./models"

export function markHiddenNodes(columns: SankeyColumn[]) {
  for (const column of columns) {
    for (const [rowIdx, node] of column.nodes.entries()) {
      if (!column.visibleRows) {
        throw new Error("column.visibleRows must be defined at this point!")
      }
      const isRowHidden =
        rowIdx < column.visibleRows[0] || rowIdx >= column.visibleRows[1]
      if (isRowHidden) {
        node.isHidden = true
        // TODO: node.sourceLinks.forEach(l => (l.isHidden = true))
        node.targetLinks.forEach(l => (l.isHidden = true))
      }
    }
  }
}
