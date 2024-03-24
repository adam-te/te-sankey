import { SankeyConfig, SankeyGraph } from "."
import { computeSankeyYScale } from "./computeSankeyYScale"
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

  //   const columns = computeNodeColumns(nodes);
  const spacingBetweenColumns = computeSpacingBetweenColumns(
    sankeyConfig.width,
    graph.columns,
    sankeyConfig
  )

  // TODO: property of column instead of bool on node
  markHiddenNodes(graph.columns)
  // const yScale = computeSankeyYScale(graph, sankeyConfig)

  // getFocusedColumn()

  // FOR EACH COLUMN
  // yScale is sum of all flows for that column
  // CREATE SINGLE FAKE LINK
  // graph.columns.
  // TODO: Compute flows for scale

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
