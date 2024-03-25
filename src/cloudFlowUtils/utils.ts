import { SankeyColumn, SankeyNode } from "../sankeyUtils"

/** Focused column is the column "after" the focusedNode, or the first column if none */
export function getFocusedColumn({
  columns,
  selectedNodeIds,
}: {
  columns: SankeyColumn[]
  selectedNodeIds: string[]
}): SankeyColumn {
  const focusedNodeColumnIdx = columns.findIndex(c => c.nodes.some(n => n.id === selectedNodeIds.at(-1)))

  return columns[focusedNodeColumnIdx + 1] || columns[0]
}

export function getNodeWidth(node: SankeyNode) {
  if (node.x1 == null || node.x0 == null) {
    throw new Error("node.x0 and node.x1 must be defined!")
  }
  return node.x1 - node.x0
}

export function getNodeHeight(node: SankeyNode) {
  if (node.y1 == null || node.y0 == null) {
    throw new Error("node.y0 and node.y1 must be defined!")
  }
  return node.y1 - node.y0
}

export function getFlowsEndPercentage(node: SankeyNode) {
  if (node.y1 == null || node.y0 == null || node.linksEndY == null) {
    return null
    //   TODO: throw new Error("node.y0, node.y1 and node.linksEndY must be defined!")
  }
  return ((node.linksEndY - node.y0) / (node.y1 - node.y0)) * 100
}

export function getColumnX(column: SankeyColumn): number | null {
  if (!column.nodes.length) {
    return null
  }
  // @ts-ignore
  return column.nodes.find(v => v.x0 != null).x0
}

export function getVisibleNodeIds(column: SankeyColumn): Set<string> {
  const nodeIds = new Set<string>()
  for (const [rowIdx, node] of column.nodes.entries()) {
    if (!column.visibleRows) {
      throw new Error("column.visibleRows must be defined at this point!")
    }
    const isRowHidden = rowIdx < column.visibleRows[0] || rowIdx >= column.visibleRows[1]
    if (!isRowHidden) {
      nodeIds.add(node.id)
    }
  }
  return nodeIds
}
