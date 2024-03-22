import {
  computeSankeyYScale,
  computeSpacingBetweenColumns,
  markHiddenNodes,
  positionColumn,
} from "./sankeyUtils";
import { SankeyConfig, SankeyGraph } from "./sankeyUtils/models";

export interface SankeyOptions {
  graphMeta: {
    width: number;
    height: number;
  };
  extent?: [[number, number], [number, number]]; // [[0, 1], [0, 1]]
  nodeWidth?: number; // 24

  nodeYPadding?: number; // 8
  linkXPadding?: number;
}

export function computeSankey(
  graph: SankeyGraph,
  options: SankeyOptions
): SankeyGraph {
  const sankeyConfig: SankeyConfig = {
    nodeWidth: 24,
    nodeYPadding: 8,
    linkXPadding: 0,
    ...options,
  };

  const globalWidth = sankeyConfig.graphMeta.width;

  //   const columns = computeNodeColumns(nodes);
  const spacingBetweenColumns = computeSpacingBetweenColumns(
    globalWidth,
    graph.columns,
    sankeyConfig
  );

  // TODO: property of column instead of bool on node
  markHiddenNodes(graph.columns);
  const yScale = computeSankeyYScale(graph, sankeyConfig);

  let x = spacingBetweenColumns;
  for (const column of graph.columns) {
    positionColumn({
      x,
      column,
      sankeyConfig,
      yScale,
    });
    x += spacingBetweenColumns + column.rightPadding;
  }

  return graph;
}

interface DisplayLink {
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
  const { start, end } = link;

  // Calculate control points for smooth curves
  const controlPointX1 = start.x + (end.x - start.x) / 3;
  const controlPointX2 = start.x + (2 * (end.x - start.x)) / 3;

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
