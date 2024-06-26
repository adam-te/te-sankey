import { SankeyConfig, SankeyGraph } from "."
import { computeSpacingBetweenColumns } from "./computeSpacingBetweenColumns"
import { markHiddenNodes } from "./markHiddenNodes"
import { positionColumn } from "./positionColumn"

export interface SankeyOptions {
  width: number
  height: number
  nodeWidth?: number // 24
  nodeYPadding?: number // 8
  linkXPadding?: number
}

export function computeSankey(graph: SankeyGraph, options: SankeyOptions): SankeyGraph {
  const sankeyConfig: SankeyConfig = {
    nodeWidth: 24,
    nodeYPadding: 8,
    linkXPadding: 0,
    ...options,
  }

  const spacingBetweenColumns = computeSpacingBetweenColumns(sankeyConfig.width, graph.columns, sankeyConfig)

  // TODO: property of column instead of bool on node
  markHiddenNodes(graph.columns)

  let x = spacingBetweenColumns
  for (const column of graph.columns) {
    positionColumn({
      x,
      column,
      sankeyConfig,
      // yScale,
    })
    x += spacingBetweenColumns + column.rightPadding
  }

  return graph
}
