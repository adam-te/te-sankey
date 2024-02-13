import {
  GraphMeta,
  SankeyConfig,
  NodeMeta,
  LinkMeta,
  SankeyGraph,
} from "./models";

import { setStartAndEnd } from "./sankeyUtils";

export interface SankeyOptions {
  extent?: [[number, number], [number, number]]; // [[0, 1], [0, 1]]
  nodeWidth?: number; // 24

  // TODO: Does this do anything?
  nodeHeight?: number; // 8
  linkXPadding?: number;
  // TODO: This appears to be fully auto-computed, don't allow as param
  // nodePadding?: number; // 0
  iterations?: number; // 6
  align?: (node: NodeMeta, n: number) => number;
  columnIdxToPadding?: Record<number, number>;

  numberOfVisibleRows?: number;
  visibleColumnsFromCenter?: number;
}

export function computeSankey(
  graph: SankeyGraph,
  options: SankeyOptions = {}
): GraphMeta {
  const sankeyConfig: SankeyConfig = {
    extent: [
      [0, 0],
      [100, 100],
    ],
    nodeWidth: 24,
    nodeHeight: 8,
    nodePadding: 0,
    linkXPadding: 0,
    iterations: 6,
    columnIdxToPadding: {},
    align: (node, n) => (node.sourceLinks.length ? node.depth : n - 1),
    numberOfVisibleRows: Infinity,
    visibleColumnsFromCenter: Infinity,
    ...options,
  };

  // Infer graph
  // TODO:
  const nodeIdToMeta = computeNodeMetas(graph, sankeyConfig);

  return {
    // @ts-ignore
    nodes: [...nodeIdToMeta.values()],
    // @ts-ignore
    links: [
      ...new Set(
        [...nodeIdToMeta.values()]
          .map((v) => [...v.sourceLinks, ...v.targetLinks])
          .flat()
      ),
    ],
  };
}

function computeNodeMetas(
  graph: SankeyGraph,
  sankeyConfig: SankeyConfig
): Map<string, NodeMeta> {
  // Create object placeholder to allow for wiring referentially
  const idToRawNodeMeta = new Map<string, NodeMeta>(
    // TODO: n.label and extra data should be sent.. Avoid mutation
    // @ts-ignore - Allow invalid NodeMeta because we don't have the
    graph.nodes.map((n) => [n.id, { ...n, id: n.id }])
  );
  const linkMetas = graph.links.map((v) => ({
    source: idToRawNodeMeta.get(v.sourceId) as NodeMeta,
    target: idToRawNodeMeta.get(v.targetId) as NodeMeta,
    value: v.value || 1,
    width: 0,
  }));
  const idToNodeMeta = new Map<string, NodeMeta>();

  for (const node of graph.nodes) {
    const sourceLinks = linkMetas.filter((l) => l.source.id === node.id);
    const targetLinks = linkMetas.filter((l) => l.target.id === node.id);

    idToNodeMeta.set(
      node.id,
      Object.assign(idToRawNodeMeta.get(node.id) as NodeMeta, {
        id: node.id,

        sourceLinks,
        targetLinks,
        value: Math.max(
          getSumOfLinkValues(sourceLinks),
          getSumOfLinkValues(targetLinks)
        ),
      })
    );
  }

  setNodeDepths(idToNodeMeta);
  setNodeInverseDepths(idToNodeMeta);

  setNodeIsHidden(idToNodeMeta, sankeyConfig);

  setNodeHeights(idToNodeMeta);
  setNodeBreadths(idToNodeMeta, sankeyConfig);
  setLinkBreadths(idToNodeMeta);

  // ADAMTODO:
  setStartAndEnd([...idToNodeMeta.values()], sankeyConfig);

  // TODO: integrate into links

  return idToNodeMeta;
}

// function computeNodeLinks({ nodes, links }: SankeyGraph) {
//   for (const [i, node] of nodes.entries()) {
//     // node.index = i;
//     node.sourceLinks = [];
//     node.targetLinks = [];
//   }
//   // @ts-ignore
//   const nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d]));
//   for (const [i, link] of links.entries()) {
//     // link.index = i;
//     let { source, target } = link;
//     if (typeof source !== "object")
//       source = link.source = find(nodeById, source);
//     if (typeof target !== "object")
//       target = link.target = find(nodeById, target);
//     source.sourceLinks.push(link);
//     target.targetLinks.push(link);
//   }
//   if (linkSort != null) {
//     for (const { sourceLinks, targetLinks } of nodes) {
//       sourceLinks.sort(linkSort);
//       targetLinks.sort(linkSort);
//     }
//   }
// }

// TODO - perf, description
function setNodeBreadths(
  idToNodeMeta: Map<string, NodeMeta>,
  sankeyConfig: SankeyConfig
) {
  const { extent, nodeHeight } = sankeyConfig;
  const [[x0, y0], [x1, y1]] = extent;
  const columns = computeNodeLayers([...idToNodeMeta.values()], sankeyConfig);

  // TODO: can we avoid mutations?
  sankeyConfig.nodePadding = Math.min(
    nodeHeight,
    (y1 - y0) / (Math.max(...columns.map((c) => c.length)) - 1)
  );
  initializeNodeBreadths(columns, sankeyConfig);
  for (let i = 0; i < sankeyConfig.iterations; ++i) {
    const alpha = Math.pow(0.99, i);
    const beta = Math.max(1 - alpha, (i + 1) / sankeyConfig.iterations);
    relaxRightToLeft(columns, alpha, beta, sankeyConfig);
    relaxLeftToRight(columns, alpha, beta, sankeyConfig);
  }
}

// rows - TODO
function setNodeHeights(idToNodeMeta: Map<string, NodeMeta>) {
  const nodes = [...idToNodeMeta.values()];
  const n = nodes.length;
  let current = new Set<NodeMeta>(nodes);
  let next = new Set<NodeMeta>();
  let x = 0;
  while (current.size) {
    for (const node of current) {
      node.height = x;
      for (const { source } of node.targetLinks) {
        next.add(source);
      }
    }
    if (++x > n) throw new Error("circular link");
    current = next;
    next = new Set();
  }
}

// Columns - how many hops to that node from the leftern-most source node
function setNodeDepths(idToNodeMeta: Map<string, NodeMeta>) {
  let nodesToIterate = new Set<NodeMeta>(idToNodeMeta.values());
  let nextNodesToIterate = new Set<NodeMeta>();

  const numberOfNodes = nodesToIterate.size;

  let depthCounter = 0;
  while (nodesToIterate.size) {
    for (const node of nodesToIterate) {
      node.depth = depthCounter;
      for (const { target } of node.sourceLinks) {
        nextNodesToIterate.add(target);
      }
    }
    if (++depthCounter > numberOfNodes) {
      throw new Error("circular link");
    }
    nodesToIterate = nextNodesToIterate;
    nextNodesToIterate = new Set();
  }
}

// Columns - how many hops to that node from the leftern-most source node
function setNodeInverseDepths(idToNodeMeta: Map<string, NodeMeta>) {
  let nodesToIterate = new Set<NodeMeta>(idToNodeMeta.values());
  let nextNodesToIterate = new Set<NodeMeta>();

  const numberOfNodes = nodesToIterate.size;

  let depthCounter = 0;
  while (nodesToIterate.size) {
    for (const node of nodesToIterate) {
      node.inverseDepth = depthCounter;
      for (const { source } of node.targetLinks) {
        nextNodesToIterate.add(source);
      }
    }
    if (++depthCounter > numberOfNodes) {
      throw new Error("circular link");
    }
    nodesToIterate = nextNodesToIterate;
    nextNodesToIterate = new Set();
  }
}

function getSumOfLinkValues(links: LinkMeta[]): number {
  return links.reduce((sum, v) => sum + v.value, 0);
}

function getMaxNodeDepth(nodes: NodeMeta[]): number {
  // @ts-ignore
  return nodes.reduce((maxDepth, v) => Math.max(maxDepth, v.depth), 0);
}

function computeNodeLayers(
  nodes: NodeMeta[],
  { extent, nodeWidth, align }: SankeyConfig
): NodeMeta[][] {
  const [[x0, y0], [x1, y1]] = extent;
  const x = getMaxNodeDepth(nodes) + 1;
  const kx = (x1 - x0 - nodeWidth) / (x - 1);
  const columns: NodeMeta[][] = new Array(x);
  for (const node of nodes) {
    const i = Math.max(0, Math.min(x - 1, Math.floor(align(node, x))));
    node.layer = i;
    node.x0 = x0 + i * kx;
    node.x1 = node.x0 + nodeWidth;
    if (columns[i]) columns[i].push(node);
    else columns[i] = [node];
  }
  // TODO:
  // if (sort)
  //   for (const column of columns) {
  //     column.sort(sort);
  //   }
  return columns;
}

function initializeNodeBreadths(
  columns: NodeMeta[][],
  sankeyConfig: SankeyConfig
) {
  const { extent, nodePadding } = sankeyConfig;
  const [[x0, y0], [x1, y1]] = extent;
  const ky = getMinColumnWhat(columns, sankeyConfig);

  for (const nodes of columns) {
    let y = y0;
    for (const node of nodes) {
      node.y0 = y;
      node.y1 = y + node.value * ky;
      y = node.y1 + nodePadding;
      // TODO:
      for (const link of node.sourceLinks) {
        link.width = link.value * ky;
      }
    }
    y = (y1 - y + nodePadding) / (nodes.length + 1);

    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      // @ts-ignore
      node.y0 += y * (i + 1);
      // @ts-ignore
      node.y1 += y * (i + 1);
    }
    reorderLinks(nodes);
  }
}

function reorderLinks(nodes: NodeMeta[]) {
  // TODO:
  // if (linkSort === undefined) {
  for (const { sourceLinks, targetLinks } of nodes) {
    sourceLinks.sort(ascendingTargetBreadth);
    targetLinks.sort(ascendingSourceBreadth);
  }
  // }
}

function ascendingSourceBreadth(a: any, b: any) {
  return ascendingBreadth(a.source, b.source) || a.index - b.index;
}

function ascendingTargetBreadth(a: any, b: any) {
  return ascendingBreadth(a.target, b.target) || a.index - b.index;
}

function ascendingBreadth(a: any, b: any) {
  return a.y0 - b.y0;
}

// Reposition each node based on its incoming (target) links.
function relaxLeftToRight(
  columns: NodeMeta[][],
  alpha: any,
  beta: any,
  sankeyConfig: SankeyConfig
) {
  for (let i = 1, n = columns.length; i < n; ++i) {
    const column = columns[i];
    for (const target of column) {
      let y = 0;
      let w = 0;
      for (const { source, value } of target.targetLinks) {
        if (target.layer == null || source.layer == null) {
          throw new Error(
            "target.layer and source.layer should be defined already!"
          );
        }
        let v = value * (target.layer - source.layer);
        y += targetTop(source, target, sankeyConfig.nodePadding) * v;
        w += v;
      }
      if (!(w > 0)) continue;
      if (target.y0 == null || target.y1 == null) {
        throw new Error("target.y0 and target.y1 should be defined already!");
      }
      let dy = (y / w - target.y0) * alpha;

      target.y0 += dy;
      target.y1 += dy;
      reorderNodeLinks(target);
    }

    /* TODO: if (sort === undefined)*/ column.sort(ascendingBreadth);
    resolveCollisions(column, beta, sankeyConfig);
  }
}

// Reposition each node based on its outgoing (source) links.
function relaxRightToLeft(
  columns: NodeMeta[][],
  alpha: any,
  beta: any,
  sankeyConfig: SankeyConfig
) {
  for (let n = columns.length, i = n - 2; i >= 0; --i) {
    const column = columns[i];
    for (const source of column) {
      let y = 0;
      let w = 0;
      for (const { target, value } of source.sourceLinks) {
        if (target.layer == null || source.layer == null) {
          throw new Error(
            "target.layer and source.layer should be defined already!"
          );
        }
        let v = value * (target.layer - source.layer);
        y += sourceTop(source, target, sankeyConfig.nodePadding) * v;
        w += v;
      }
      if (!(w > 0)) continue;
      if (source.y0 == null || source.y1 == null) {
        throw new Error(
          "target.layer and source.layer should be defined already!"
        );
      }
      let dy = (y / w - source.y0) * alpha;
      source.y0 += dy;
      source.y1 += dy;
      reorderNodeLinks(source);
    }
    /* TODO: if (sort === undefined) */ column.sort(ascendingBreadth);
    resolveCollisions(column, beta, sankeyConfig);
  }
}

function resolveCollisions(
  nodes: any,
  alpha: any,
  { extent, nodePadding }: SankeyConfig
) {
  const [[x0, y0], [x1, y1]] = extent;

  const i = nodes.length >> 1;
  const subject = nodes[i];
  resolveCollisionsBottomToTop(
    nodes,
    subject.y0 - nodePadding,
    i - 1,
    alpha,
    nodePadding
  );
  resolveCollisionsTopToBottom(
    nodes,
    subject.y1 + nodePadding,
    i + 1,
    alpha,
    nodePadding
  );
  resolveCollisionsBottomToTop(nodes, y1, nodes.length - 1, alpha, nodePadding);
  resolveCollisionsTopToBottom(nodes, y0, 0, alpha, nodePadding);
}

// Push any overlapping nodes down.
function resolveCollisionsTopToBottom(
  nodes: any,
  y: any,
  i: any,
  alpha: any,
  nodePadding: number
) {
  for (; i < nodes.length; ++i) {
    const node = nodes[i];
    const dy = (y - node.y0) * alpha;
    if (dy > 1e-6) (node.y0 += dy), (node.y1 += dy);
    y = node.y1 + nodePadding;
  }
}

// Push any overlapping nodes up.
function resolveCollisionsBottomToTop(
  nodes: any,
  y: any,
  i: any,
  alpha: any,
  nodePadding: number
) {
  for (; i >= 0; --i) {
    const node = nodes[i];
    const dy = (node.y1 - y) * alpha;
    if (dy > 1e-6) (node.y0 -= dy), (node.y1 -= dy);
    y = node.y0 - nodePadding;
  }
}

function reorderNodeLinks({
  sourceLinks,
  targetLinks,
}: {
  sourceLinks: LinkMeta[];
  targetLinks: LinkMeta[];
}) {
  // TODO: if (linkSort === undefined) {
  for (const link of targetLinks) {
    link.source.sourceLinks.sort(ascendingTargetBreadth);
  }
  for (const link of sourceLinks) {
    link.target.targetLinks.sort(ascendingSourceBreadth);
  }
  // TODO }
}

// Returns the target.y0 that would produce an ideal link from source to target.
function targetTop(source: NodeMeta, target: NodeMeta, nodePadding: number) {
  if (source.y0 == null) {
    throw new Error("source.y0 should not be empty here!");
  }
  let y = source.y0 - ((source.sourceLinks.length - 1) * nodePadding) / 2;
  for (const { target: node, width } of source.sourceLinks) {
    if (node === target) break;
    if (width == null) {
      throw new Error("width should not be empty here!");
    }
    y += width + nodePadding;
  }
  for (const { source: node, width } of target.targetLinks) {
    if (node === source) break;
    if (width == null) {
      throw new Error("width should not be empty here!");
    }
    y -= width;
  }
  return y;
}

// Returns the source.y0 that would produce an ideal link from source to target.
function sourceTop(source: NodeMeta, target: NodeMeta, nodePadding: number) {
  if (target.y0 == null) {
    throw new Error("target.y0 should not be empty here!");
  }
  let y = target.y0 - ((target.targetLinks.length - 1) * nodePadding) / 2;
  for (const { source: node, width } of target.targetLinks) {
    if (node === source) break;
    if (width == null) {
      throw new Error("width should not be empty here!");
    }
    y += width + nodePadding;
  }
  for (const { target: node, width } of source.sourceLinks) {
    if (node === target) break;
    if (width == null) {
      throw new Error("width should not be empty here!");
    }
    y -= width;
  }
  return y;
}

function setLinkBreadths(idToNodeMeta: Map<string, NodeMeta>) {
  for (const node of idToNodeMeta.values()) {
    if (node.y0 == null) {
      throw new Error("node.y0 should not be empty!");
    }
    let y0 = node.y0;
    let y1 = y0;
    for (const link of node.sourceLinks) {
      if (link.width == null) {
        throw new Error("link.width should not be empty!");
      }
      link.y0 = y0 + link.width / 2;
      y0 += link.width as number;
    }
    for (const link of node.targetLinks) {
      if (link.width == null) {
        throw new Error("link.width should not be empty!");
      }
      link.y1 = y1 + link.width / 2;
      y1 += link.width;
    }
  }
}
// TODO: What is this doing?
function getMinColumnWhat(
  columns: NodeMeta[][],
  { extent, nodePadding }: SankeyConfig
): number {
  const [[x0, y0], [x1, y1]] = extent;

  let minValue;
  for (const columnNodes of columns) {
    const newValue =
      (y1 - y0 - (columnNodes.length - 1) * nodePadding) /
      sum(columnNodes, (v) => v.value);
    if (minValue == null || newValue < minValue) {
      minValue = newValue;
    }
  }

  // NaN
  // console.log(columns);
  // @ts-ignore
  return minValue;
}

function sum<T>(values: T[], getValue: (value: T) => number): number {
  return values.reduce((sum, nextValue) => sum + getValue(nextValue), 0);
}

// Can we ignore depth though?
// WANT - show last X isSource and first Y isDest use DFS and track source/dest depth
// forEachRoute
// Columns - how many hops to that node from the leftern-most source node
function setNodeIsHidden(
  idToNodeMeta: Map<string, NodeMeta>,
  config: SankeyConfig
) {
  const nodes = [...idToNodeMeta.values()];
  const maxDepth = Math.max(...nodes.map((n) => n.depth as number));
  const middleNodeDepth = maxDepth / 2;

  for (const node of nodes) {
    const isVisibleFromSource =
      (node.depth as number) >
      middleNodeDepth - config.visibleColumnsFromCenter;
    const isVisibleFromDest =
      (node.inverseDepth as number) >
      middleNodeDepth - config.visibleColumnsFromCenter;
    node.isHidden = !(isVisibleFromSource && isVisibleFromDest);
  }
}

interface DisplayNode {
  x0: number; // 10,
  x1: number; // 70,
  y0: number; // 30,
  y1: number; // 50,
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

// function assertValidDisplayLink(link: DisplayLink) {
//   if (!link.sourceHeight) {
//     throw new Error("Invalid Link! Missing sourceHeight");
//   }
//   if (!link.targetHeight) {
//     throw new Error("Invalid Link! Missing targetHeight");
//   }
// }

// TODO: Optimize
// export function computeSankeyLinkPath(link: DisplayLink): string {
//   // TODO: Don't put into production build
//   assertValidDisplayLink(link);

//   const start = {
//     x: link.source.x1,
//     y: link.source.y0 + link.sourceHeight / 2,
//     height: link.sourceHeight,
//   };
//   const end = {
//     x: link.target.x0,
//     y: link.target.y0 + link.targetHeight / 2,
//     height: link.targetHeight,
//   };
//   // Calculate control points for smooth curves
//   const controlPointX1 = start.x + (end.x - start.x) / 3;
//   const controlPointX2 = start.x + (2 * (end.x - start.x)) / 3;

//   // Calculate the top and bottom points for the start and end
//   const startTop = start.y - start.height / 2;
//   const startBottom = start.y + start.height / 2;
//   const endTop = end.y - end.height / 2;
//   const endBottom = end.y + end.height / 2;

//   // Construct the Bezier curve
//   return [
//     `M${start.x},${startTop}`, // Move to start top
//     `C${controlPointX1},${startTop} ${controlPointX2},${endTop} ${end.x},${endTop}`, // Curve to end top
//     `L${end.x},${endTop}`, // Line to end top (for clarity, technically redundant)
//     `L${end.x},${endBottom}`, // Line to end bottom
//     `C${controlPointX2},${endBottom} ${controlPointX1},${startBottom} ${start.x},${startBottom}`, // Curve to start bottom
//     "Z", // Close path
//   ].join(" ");
// }

// function assertValidDisplayLink(link: DisplayLink) {
//   if (!link.sourceHeight) {
//     throw new Error("Invalid Link! Missing sourceHeight");
//   }
//   if (!link.targetHeight) {
//     throw new Error("Invalid Link! Missing targetHeight");
//   }
// }
