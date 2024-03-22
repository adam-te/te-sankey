import { scaleLinear } from "d3-scale";
import { SankeyColumn, SankeyConfig, SankeyGraph, SankeyNode } from "./models";

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

// Symmetric fit
export function computeSpacingBetweenColumns(
  rectangleWidth: number,
  columns: SankeyColumn[],
  sankeyConfig: SankeyConfig
) {
  const columnWidth = sankeyConfig.nodeWidth;

  const totalPadding = Object.values(columns.map((c) => c.rightPadding)).reduce(
    (a, b) => a + b,
    0
  );
  const totalColumnsWidth = columnWidth * columns.length + totalPadding; // Calculate total width needed for all columns
  const totalSpaces = columns.length + 1; // Calculate total spaces between columns and on the edges

  // Calculate spacing based on the rectangle width, total columns width, and total spaces
  return (rectangleWidth - totalColumnsWidth) / totalSpaces;
}

export function computeSankeyYScale(
  graph: SankeyGraph,
  sankeyConfig: SankeyConfig
) {
  return scaleLinear()
    .domain([0, getGraphVisibleNodeFlowValue(graph)])
    .range([0, sankeyConfig.graphMeta.height]);
}

function getGraphVisibleNodeFlowValue(graph: SankeyGraph) {
  const nodes = graph.columns[0].nodes;

  let totalFlowValue = 0;
  for (const node of nodes.filter((n) => !n.isHidden)) {
    for (const link of node.sourceLinks) {
      totalFlowValue += link.value;
    }
  }

  return totalFlowValue;
}
