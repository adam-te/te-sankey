import {
  SankeyConfig,
  SankeyNode,
  SankeyLink,
  SankeyGraph,
  MetaGraph,
} from "./models";

import { setStartAndEnd } from "./sankeyUtils";

export interface SankeyOptions {
  graphMeta: {
    width: number;
    height: number;
  };
  extent?: [[number, number], [number, number]]; // [[0, 1], [0, 1]]
  nodeWidth?: number; // 24

  // TODO: Does this do anything?
  nodeHeight?: number; // 8
  nodePadding?: number; // 8
  linkXPadding?: number;
}

export function computeSankey(
  graph: SankeyGraph,
  options: SankeyOptions
): MetaGraph {
  const sankeyConfig: SankeyConfig = {
    nodeWidth: 24,
    nodeHeight: 8,
    nodePadding: 8,
    linkXPadding: 0,
    ...options,
  };

  setStartAndEnd(graph, sankeyConfig);

  return graph;
}

interface DisplayLink {
  // source: DisplayNode;
  // target: DisplayNode;
  // y0: number; // 40,
  // y1: number; // 140,
  // sourceHeight: number; // 10
  // targetHeight: number; // 10
  start: {
    x: number; //x + sankeyConfig.nodeWidth,
    y0: number; // y0 + linkStartY0,
    y1: number; // y0 + linkStartY0 + linkHeight,
  };
  end: {
    x: number; //x + sankeyConfig.nodeWidth,
    y0: number; // y0 + linkStartY0,
    y1: number; // y0 + linkStartY0 + linkHeight,
  };
}

export function computeSankeyLinkPath(link: DisplayLink): string {
  // TODO: Don't put into production build

  const { start, end } = link;

  // Calculate control points for smooth curves
  const controlPointX1 = start.x + (end.x - start.x) / 3;
  const controlPointX2 = start.x + (2 * (end.x - start.x)) / 3;

  // Calculate the top and bottom points for the start and end
  // const startTop = start.y - startHeight / 2;
  // const startBottom = start.y + startHeight / 2;
  // const endTop = end.y - endHeight / 2;
  // const endBottom = end.y + endHeight / 2;

  const startTop = start.y0;
  const startBottom = start.y1;
  const endTop = end.y0;
  const endBottom = end.y1;

  // Construct the Bezier curve
  return [
    `M${start.x},${startTop}`, // Move to start top
    `C${controlPointX1},${startTop} ${controlPointX2},${endTop} ${end.x},${endTop}`, // Curve to end top
    `L${end.x},${endTop}`, // Line to end top (for clarity, technically redundant)
    `L${end.x},${endBottom}`, // Line to end bottom
    `C${controlPointX2},${endBottom} ${controlPointX1},${startBottom} ${start.x},${startBottom}`, // Curve to start bottom
    "Z", // Close path
  ].join(" ");
}
