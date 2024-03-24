import { SankeyColumn, SankeyNode } from "./models"

export function getColumnFlowToNodes(column: SankeyColumn, nodeIds: Set<string>) {
  let columnSourceFlow = 0
  let columnTargetFlow = 0
  for (const node of column.nodes) {
    for (const link of node.sourceLinks) {
      if (!nodeIds.has(link.target.id)) {
        continue
      }
      columnSourceFlow += link.value
    }

    for (const link of node.targetLinks) {
      if (!nodeIds.has(link.source.id)) {
        continue
      }
      columnTargetFlow += link.value
    }
  }

  return Math.max(columnSourceFlow, columnTargetFlow)
}

export function getColumnVisibleFlowValue(column: SankeyColumn) {
  let columnSourceFlow = 0
  let columnTargetFlow = 0
  for (const node of column.nodes) {
    for (const link of node.sourceLinks) {
      if (link.target.isHidden) {
        continue
      }
      columnSourceFlow += link.value
    }

    for (const link of node.targetLinks) {
      if (link.source.isHidden) {
        continue
      }
      columnTargetFlow += link.value
    }
  }

  return Math.max(columnSourceFlow, columnTargetFlow)
}

export function getColumnTotalFlowValue(column: SankeyColumn) {
  let columnSourceFlow = 0
  let columnTargetFlow = 0
  for (const node of column.nodes) {
    for (const link of node.sourceLinks) {
      columnSourceFlow += link.value
    }

    for (const link of node.targetLinks) {
      columnTargetFlow += link.value
    }
  }

  return Math.max(columnSourceFlow, columnTargetFlow)
}

export function getNodeVisibleFlowValue(node: SankeyNode) {
  let nodeSourceFlow = 0
  for (const link of node.sourceLinks) {
    if (link.source.isHidden) {
      continue
    }
    nodeSourceFlow += link.value
  }

  let nodeTargetFlow = 0
  for (const link of node.targetLinks) {
    if (link.source.isHidden) {
      continue
    }
    nodeTargetFlow += link.value
  }

  return Math.max(nodeSourceFlow, nodeTargetFlow)
}

export function getNodeTotalFlowValue(node: SankeyNode) {
  let nodeSourceFlow = 0
  for (const link of node.sourceLinks) {
    nodeSourceFlow += link.value
  }

  let nodeTargetFlow = 0
  for (const link of node.targetLinks) {
    nodeTargetFlow += link.value
  }

  return Math.max(nodeSourceFlow, nodeTargetFlow)
}
