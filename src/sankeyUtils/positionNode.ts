import { ScaleLinear, scaleLinear } from "d3-scale";
import { getNodeTotalFlowValue } from "./utils";
import { positionLinks } from "./positionLinks";
import { SankeyConfig, SankeyNode } from "./models";

export function positionNode({
  x,
  y0,
  yScale,
  node,
  sankeyConfig,
}: {
  x: number;
  y0: number;
  yScale: ScaleLinear<number, number>;
  node: SankeyNode;
  sankeyConfig: SankeyConfig;
}) {
  const nodeHeight =
    yScale(getNodeTotalFlowValue(node)) - sankeyConfig.nodeYPadding;

  Object.assign(node, {
    x0: x,
    x1: x + sankeyConfig.nodeWidth,
    y0: y0,
    y1: y0 + nodeHeight,
  });

  // ADAMTODO:
  yScale = computeLinksYScale(node);

  const { linksEndY } = positionLinks({
    x,
    y0,
    yScale,
    links: node.sourceLinks.filter((v) => !v.isHidden),
    sankeyConfig: {
      ...sankeyConfig,
      linkXPadding: sankeyConfig.linkXPadding + sankeyConfig.nodeWidth,
    },
    type: "start",
  });
  node.linksEndY = linksEndY;

  positionLinks({
    x,
    y0,
    yScale,
    links: node.targetLinks.filter((v) => !v.isHidden),
    sankeyConfig: {
      ...sankeyConfig,
      linkXPadding: -sankeyConfig.linkXPadding,
    },
    type: "end",
  });

  return {
    nodeHeight,
  };
}

function computeLinksYScale(node: SankeyNode): ScaleLinear<number, number> {
  if (node.y0 == null || node.y1 == null) {
    throw new Error("node.(y0, y1) must be defined!");
  }
  // TODO: I think should be equal, check ui
  // TODO(perf), pre-compute this
  const maxSourceValue = node.sourceLinks.reduce((a, v) => a + v.value, 0);
  const maxTargetValue = node.targetLinks.reduce((a, v) => a + v.value, 0);
  return scaleLinear()
    .range([0, node.y1 - node.y0])
    .domain([0, Math.max(maxSourceValue, maxTargetValue)]);
}

// function sum() {}
