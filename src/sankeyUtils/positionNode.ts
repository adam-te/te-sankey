import { ScaleLinear } from "d3-scale";
import { SankeyConfig, SankeyNode } from "../models";
import { getNodeTotalFlowValue, getNodeVisibleFlowValue } from "./utils";
import { positionSourceLinks } from "./positionSourceLinks";
import { positionTargetLinks } from "./positionTargetLinks";

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

  //   console.log(
  //     "SOURCE",
  //     node.sourceLinks.filter((v) => !v.isHidden)
  //   );
  console.log("global y0", y0);
  const { linksEndY } = positionSourceLinks({
    x,
    y0,
    yScale,
    links: node.sourceLinks.filter((v) => !v.isHidden),
    sankeyConfig,
  });
  // TODO: IS this necessary? Just use derived getter instead
  node.linksEndY = linksEndY;

  //   console.log(
  //     "TARGET",
  //     node.targetLinks.filter((v) => !v.isHidden)
  //   );
  positionTargetLinks({
    x,
    y0,
    yScale,
    links: node.targetLinks.filter((v) => !v.isHidden),
    sankeyConfig,
  });

  return {
    nodeHeight,
  };
}
