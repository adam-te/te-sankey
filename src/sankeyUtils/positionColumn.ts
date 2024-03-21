import { ScaleLinear, scaleLinear } from "d3-scale";
import { SankeyColumn, SankeyConfig, SankeyNode } from "../models";
import { positionNode } from "./positionNode";
import { getNodeTotalFlowValue } from "./utils";

export function positionColumn({
  x,
  column,
  sankeyConfig,
  yScale,
}: {
  x: number;
  column: SankeyColumn;
  sankeyConfig: SankeyConfig;
  yScale: ScaleLinear<number, number>;
}) {
  if (!column.visibleRows) {
    throw new Error("column.visibleRows needs to be defined!");
  }

  const visibleColumnNodes = column.nodes.slice(
    column.visibleRows[0],
    column.visibleRows[1]
  );

  const totalColumnFlowValue = getColumnTotalFlowValue(visibleColumnNodes);
  const innerYScale = scaleLinear()
    .domain([0, totalColumnFlowValue])
    .range([
      0,
      sankeyConfig.graphMeta.height -
        sankeyConfig.nodeYPadding * visibleColumnNodes.length,
    ]);
  // TODO: Settle on single applicable yScale definition
  yScale = innerYScale;

  let y0 = 0;
  for (const node of visibleColumnNodes) {
    const { nodeHeight } = positionNode({
      x,
      y0,
      yScale,
      node,
      sankeyConfig,
    });

    y0 += nodeHeight + sankeyConfig.nodeYPadding;
  }
}

function getColumnTotalFlowValue(columnNodes: SankeyNode[]) {
  let totalColumnFlowValue = 0;
  for (const node of columnNodes) {
    totalColumnFlowValue += getNodeTotalFlowValue(node);
  }

  return totalColumnFlowValue;
}
