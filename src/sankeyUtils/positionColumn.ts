import { scaleLinear } from "d3-scale"
import { positionNode } from "./positionNode"
import { getNodeTotalFlowValue } from "./utils"
import { SankeyColumn, SankeyConfig } from "./models"

export function positionColumn({
  x,
  column,
  sankeyConfig,
}: // yScale,
{
  x: number
  column: SankeyColumn
  sankeyConfig: SankeyConfig
  // yScale: ScaleLinear<number, number>
}) {
  if (!column.visibleRows) {
    throw new Error("column.visibleRows needs to be defined!")
  }

  const visibleColumnNodes = getVisibleNodes(column)
  const yScale = computeColumnYScale(column, sankeyConfig)

  let y0 = 0
  for (const node of visibleColumnNodes) {
    const { nodeHeight } = positionNode({
      x,
      y0,
      yScale,
      node,
      sankeyConfig,
    })

    y0 += nodeHeight + sankeyConfig.nodeYPadding
  }
}

function computeColumnYScale(column: SankeyColumn, sankeyConfig: SankeyConfig) {
  return scaleLinear()
    .domain([0, getColumnTotalFlowValue(column)])
    .range([0, sankeyConfig.height])
}

function getVisibleNodes(column: SankeyColumn) {
  return column.nodes.slice(column.visibleRows[0], column.visibleRows[1])
}

function getColumnTotalFlowValue(column: SankeyColumn) {
  const visibleColumnNodes = column.nodes.slice(column.visibleRows[0], column.visibleRows[1])
  let totalColumnFlowValue = 0
  for (const node of visibleColumnNodes) {
    totalColumnFlowValue += getNodeTotalFlowValue(node)
  }

  return totalColumnFlowValue
}
