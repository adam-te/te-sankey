import { SankeyColumn, SankeyConfig, SankeyNode } from "./models";

export function getNodeVisibleFlowValue(node: SankeyNode) {
  let totalNodeSourceFlowValue = 0;
  for (const link of node.sourceLinks.filter((v) => !v.isHidden)) {
    totalNodeSourceFlowValue += link.value;
  }

  let totalNodeTargetFlowValue = 0;
  for (const link of node.targetLinks.filter((v) => !v.isHidden)) {
    totalNodeTargetFlowValue += link.value;
  }

  return Math.max(totalNodeSourceFlowValue, totalNodeTargetFlowValue);
}

export function getNodeTotalFlowValue(node: SankeyNode) {
  let totalNodeSourceFlowValue = 0;
  for (const link of node.sourceLinks) {
    totalNodeSourceFlowValue += link.value;
  }

  let totalNodeTargetFlowValue = 0;
  for (const link of node.targetLinks) {
    totalNodeTargetFlowValue += link.value;
  }

  return Math.max(totalNodeSourceFlowValue, totalNodeTargetFlowValue);
}
