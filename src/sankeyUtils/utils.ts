import { SankeyColumn, SankeyNode } from "./models"

export function getColumnTotalFlowValue(column: SankeyColumn) {
  if (column.staticLink) {
    return column.staticLink.totalValue
  }
}

export function getNodeTotalFlowValue(node: SankeyNode) {
  let totalNodeSourceFlowValue = 0
  for (const link of node.sourceLinks) {
    totalNodeSourceFlowValue += link.value
  }

  // let totalNodeTargetFlowValue = 0
  // for (const link of node.targetLinks) {
  //   totalNodeTargetFlowValue += link.value
  // }

  return totalNodeSourceFlowValue
  // return Math.max(totalNodeSourceFlowValue, totalNodeTargetFlowValue)
}
