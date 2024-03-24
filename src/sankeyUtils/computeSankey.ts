import {
  SankeyConfig,
  SankeyGraph,
  computeSankeyYScale,
  computeSpacingBetweenColumns,
  markHiddenNodes,
  positionColumn,
} from "."
export interface SankeyOptions {
  width: number
  height: number
  extent?: [[number, number], [number, number]] // [[0, 1], [0, 1]]
  nodeWidth?: number // 24

  nodeYPadding?: number // 8
  linkXPadding?: number
}

export function computeSankey(
  graph: SankeyGraph,
  options: SankeyOptions
): SankeyGraph {
  const sankeyConfig: SankeyConfig = {
    nodeWidth: 24,
    nodeYPadding: 8,
    linkXPadding: 0,
    ...options,
  }

  //   const columns = computeNodeColumns(nodes);
  const spacingBetweenColumns = computeSpacingBetweenColumns(
    sankeyConfig.width,
    graph.columns,
    sankeyConfig
  )

  // TODO: property of column instead of bool on node
  markHiddenNodes(graph.columns)
  const yScale = computeSankeyYScale(graph, sankeyConfig)

  // graph.columns.
  // TODO: Compute flows for scale

  let x = spacingBetweenColumns
  for (const column of graph.columns) {
    positionColumn({
      x,
      column,
      sankeyConfig,
      yScale,
    })
    x += spacingBetweenColumns + column.rightPadding
  }

  return graph
}
