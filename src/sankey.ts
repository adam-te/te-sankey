import {
  SankeyConfig,
  NodeMeta,
  LinkMeta,
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
  align?: (node: NodeMeta, n: number) => number;
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

  // Infer graph
  // TODO:
  // const nodeIdToMeta = computeNodeMetas(graph, sankeyConfig);
  const metaGraph = getMetaGraph(graph);
  console.log("meta", metaGraph);
  setStartAndEnd(metaGraph, sankeyConfig);

  return metaGraph;
}

function getMetaGraph(
  graph: SankeyGraph
  // sankeyConfig: SankeyConfig
): MetaGraph {
  // Create object placeholder to allow for wiring referentially
  const idToNodeMeta = new Map<string, Partial<NodeMeta>>(
    graph.nodes.map((n) => [n.id, { ...n, id: n.id }])
  );
  const linkMetas: LinkMeta[] = graph.links.map((v) => {
    const linkMeta = {
      ...v,
      source: idToNodeMeta.get(v.sourceId) as NodeMeta,
      target: idToNodeMeta.get(v.targetId) as NodeMeta,
      value: v.value || 1,
    };

    // @ts-ignore
    delete linkMeta.sourceId;
    // @ts-ignore
    delete linkMeta.targetId;

    return linkMeta;
  });
  for (const node of graph.nodes) {
    const sourceLinks = linkMetas.filter((l) => l.source.id === node.id);
    const targetLinks = linkMetas.filter((l) => l.target.id === node.id);

    idToNodeMeta.set(
      node.id,
      Object.assign(idToNodeMeta.get(node.id) as NodeMeta, {
        sourceLinks,
        targetLinks,
      })
    );
  }

  return {
    // @ts-ignore
    nodes: [...idToNodeMeta.values()],
    links: linkMetas,
    // @ts-ignore
    columns: graph.columns.map((v) => ({
      visibleRows: [0, v.nodes.length],
      visibleStartIdx: 0,
      rightPadding: 0,
      ...v,
      nodes: v.nodes.map((v) => idToNodeMeta.get(v.id)),
    })),
  };
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
