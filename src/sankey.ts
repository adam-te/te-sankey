import { max, min, sum } from "d3-array";
import { justify } from "./align.js";
import constant from "./constant.js";
import {
  SankeyExtraProperties,
  SankeyGraph,
  SankeyLayout,
  SankeyLink,
  SankeyNode,
} from "./types.js";

function ascendingSourceBreadth(a: any, b: any) {
  return ascendingBreadth(a.source, b.source) || a.index - b.index;
}

function ascendingTargetBreadth(a: any, b: any) {
  return ascendingBreadth(a.target, b.target) || a.index - b.index;
}

function ascendingBreadth(a: any, b: any) {
  return a.y0 - b.y0;
}

function value(d: any) {
  return d.value;
}

function defaultId(d: any) {
  return d.index;
}

function defaultNodes<
  N extends SankeyExtraProperties = {},
  L extends SankeyExtraProperties = {}
>(graph: SankeyGraph<N, L>) {
  return graph.nodes;
}

function defaultLinks<
  N extends SankeyExtraProperties = {},
  L extends SankeyExtraProperties = {}
>(graph: SankeyGraph<N, L>) {
  return graph.links;
}

function find<T>(nodeById: Map<string, T>, id: string) {
  const node = nodeById.get(id);
  if (!node) throw new Error("missing: " + id);
  return node;
}

function computeLinkBreadths<
  N extends SankeyExtraProperties = {},
  L extends SankeyExtraProperties = {}
>({ nodes }: SankeyGraph<N, L>) {
  for (const node of nodes) {
    let y0 = node.y0;
    let y1 = y0;
    for (const link of node.sourceLinks) {
      link.y0 = y0 + link.width / 2;
      y0 += link.width;
    }
    for (const link of node.targetLinks) {
      link.y1 = y1 + link.width / 2;
      y1 += link.width;
    }
  }
}

/**
 * Get a Sankey layout generator.
 *
 * The nodes/links accessors need to be configured to work with the data type of the first argument passed
 * in when invoking the Sankey layout generator.
 *
 * The first generic corresponds to the data type of the first argument passed in when invoking the Sankey layout generator,
 * and its nodes/links accessors.
 *
 * The second generic N refers to user-defined properties contained in the node data passed into
 * Sankey layout generator. These properties are IN EXCESS to the properties explicitly identified in the
 * SankeyNodeMinimal interface.
 *
 * The third generic L refers to user-defined properties contained in the link data passed into
 * Sankey layout generator. These properties are IN EXCESS to the properties explicitly identified in the
 * SankeyLinkMinimal interface.
 */
export default function Sankey<
  N extends SankeyExtraProperties = {},
  L extends SankeyExtraProperties = {}
>(): SankeyLayout<SankeyGraph<SankeyNode<N, L>, SankeyLink<N, L>>, N, L> {
  let x0 = 0,
    y0 = 0,
    x1 = 1,
    y1 = 1; // extent
  let dx = 24; // nodeWidth
  let dy = 8,
    py: any; // nodePadding
  let id = defaultId;
  let align = justify;
  let sort: any;
  let linkSort: any;
  let nodes = defaultNodes;
  let links = defaultLinks;
  let iterations = 6;

  function sankey() {
    const graph = {
      nodes: nodes.apply(null, arguments as any),
      links: links.apply(null, arguments as any),
    };
    computeNodeLinks(graph);
    computeNodeValues(graph);
    computeNodeDepths(graph);
    computeNodeHeights(graph);
    computeNodeBreadths(graph);
    computeLinkBreadths(graph);
    return graph;
  }

  Object.assign(sankey, {
    update,
    nodeId,
    nodeAlign,
    nodeSort,
    nodeWidth,
    nodePadding,
    nodes(_: any) {
      return arguments.length
        ? ((nodes = typeof _ === "function" ? _ : constant(_)), sankey)
        : nodes;
    },
    links(_: any) {
      return arguments.length
        ? ((links = typeof _ === "function" ? _ : constant(_)), sankey)
        : links;
    },
    linkSort(_: any) {
      return arguments.length ? ((linkSort = _), sankey) : linkSort;
    },
    size(_: any) {
      return arguments.length
        ? ((x0 = y0 = 0), (x1 = +_[0]), (y1 = +_[1]), sankey)
        : [x1 - x0, y1 - y0];
    },
    extent(_: any) {
      return arguments.length
        ? ((x0 = +_[0][0]),
          (x1 = +_[1][0]),
          (y0 = +_[0][1]),
          (y1 = +_[1][1]),
          sankey)
        : [
            [x0, y0],
            [x1, y1],
          ];
    },
    iterations(_: any) {
      return arguments.length ? ((iterations = +_), sankey) : iterations;
    },
  });

  function update<
    N extends SankeyExtraProperties = {},
    L extends SankeyExtraProperties = {}
  >(graph: SankeyGraph<N, L>) {
    computeLinkBreadths(graph);
    return graph;
  }

  function nodeId(_: any) {
    return arguments.length
      ? ((id = typeof _ === "function" ? _ : constant(_)), sankey)
      : id;
  }

  function nodeAlign(_: any) {
    return arguments.length
      ? ((align = typeof _ === "function" ? _ : constant(_)), sankey)
      : align;
  }

  function nodeSort(_: any) {
    return arguments.length ? ((sort = _), sankey) : sort;
  }

  function nodeWidth(_: any) {
    return arguments.length ? ((dx = +_), sankey) : dx;
  }

  function nodePadding(_: any) {
    return arguments.length ? ((dy = py = +_), sankey) : dy;
  }

  function computeNodeLinks({ nodes, links }: { nodes: any[]; links: any[] }) {
    for (const [i, node] of nodes.entries()) {
      node.index = i;
      node.sourceLinks = [];
      node.targetLinks = [];
    }
    // @ts-ignore
    const nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d]));
    for (const [i, link] of links.entries()) {
      link.index = i;
      let { source, target } = link;
      if (typeof source !== "object")
        source = link.source = find(nodeById, source);
      if (typeof target !== "object")
        target = link.target = find(nodeById, target);
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    }
    if (linkSort != null) {
      for (const { sourceLinks, targetLinks } of nodes) {
        sourceLinks.sort(linkSort);
        targetLinks.sort(linkSort);
      }
    }
  }

  function computeNodeValues({ nodes }: { nodes: any[] }) {
    for (const node of nodes) {
      node.value =
        node.fixedValue === undefined
          ? Math.max(sum(node.sourceLinks, value), sum(node.targetLinks, value))
          : node.fixedValue;
    }
  }

  function computeNodeDepths({ nodes }: { nodes: any[] }) {
    const n = nodes.length;
    let current = new Set(nodes);
    let next = new Set();
    let x = 0;
    while (current.size) {
      for (const node of current) {
        node.depth = x;
        for (const { target } of node.sourceLinks) {
          next.add(target);
        }
      }
      if (++x > n) throw new Error("circular link");
      current = next;
      next = new Set();
    }
  }

  function computeNodeHeights({ nodes }: { nodes: any[] }) {
    const n = nodes.length;
    let current = new Set(nodes);
    let next = new Set();
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

  function computeNodeLayers({ nodes }: { nodes: any[] }) {
    const x = max(nodes, (d) => d.depth) + 1;
    const kx = (x1 - x0 - dx) / (x - 1);
    const columns = new Array(x);
    for (const node of nodes) {
      const i = Math.max(
        0,
        Math.min(x - 1, Math.floor(align.call(null, node, x)))
      );
      node.layer = i;
      node.x0 = x0 + i * kx;
      node.x1 = node.x0 + dx;
      if (columns[i]) columns[i].push(node);
      else columns[i] = [node];
    }
    if (sort)
      for (const column of columns) {
        column.sort(sort);
      }
    return columns;
  }

  function initializeNodeBreadths(columns: any[]) {
    const ky = min(
      columns,
      (c) => (y1 - y0 - (c.length - 1) * py) / sum(c, value)
    );
    for (const nodes of columns) {
      let y = y0;
      for (const node of nodes) {
        node.y0 = y;
        // @ts-ignore
        node.y1 = y + node.value * ky;
        y = node.y1 + py;
        for (const link of node.sourceLinks) {
          // @ts-ignore
          link.width = link.value * ky;
        }
      }
      y = (y1 - y + py) / (nodes.length + 1);
      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        node.y0 += y * (i + 1);
        node.y1 += y * (i + 1);
      }
      reorderLinks(nodes);
    }
  }

  function computeNodeBreadths(graph: any) {
    const columns = computeNodeLayers(graph);
    // @ts-ignore
    py = Math.min(dy, (y1 - y0) / (max(columns, (c) => c.length) - 1));
    initializeNodeBreadths(columns);
    for (let i = 0; i < iterations; ++i) {
      const alpha = Math.pow(0.99, i);
      const beta = Math.max(1 - alpha, (i + 1) / iterations);
      relaxRightToLeft(columns, alpha, beta);
      relaxLeftToRight(columns, alpha, beta);
    }
  }

  // Reposition each node based on its incoming (target) links.
  function relaxLeftToRight(columns: any, alpha: any, beta: any) {
    for (let i = 1, n = columns.length; i < n; ++i) {
      const column = columns[i];
      for (const target of column) {
        let y = 0;
        let w = 0;
        for (const { source, value } of target.targetLinks) {
          let v = value * (target.layer - source.layer);
          y += targetTop(source, target) * v;
          w += v;
        }
        if (!(w > 0)) continue;
        let dy = (y / w - target.y0) * alpha;
        target.y0 += dy;
        target.y1 += dy;
        reorderNodeLinks(target);
      }
      if (sort === undefined) column.sort(ascendingBreadth);
      resolveCollisions(column, beta);
    }
  }

  // Reposition each node based on its outgoing (source) links.
  function relaxRightToLeft(columns: any, alpha: any, beta: any) {
    for (let n = columns.length, i = n - 2; i >= 0; --i) {
      const column = columns[i];
      for (const source of column) {
        let y = 0;
        let w = 0;
        for (const { target, value } of source.sourceLinks) {
          let v = value * (target.layer - source.layer);
          y += sourceTop(source, target) * v;
          w += v;
        }
        if (!(w > 0)) continue;
        let dy = (y / w - source.y0) * alpha;
        source.y0 += dy;
        source.y1 += dy;
        reorderNodeLinks(source);
      }
      if (sort === undefined) column.sort(ascendingBreadth);
      resolveCollisions(column, beta);
    }
  }

  function resolveCollisions(nodes: any, alpha: any) {
    const i = nodes.length >> 1;
    const subject = nodes[i];
    resolveCollisionsBottomToTop(nodes, subject.y0 - py, i - 1, alpha);
    resolveCollisionsTopToBottom(nodes, subject.y1 + py, i + 1, alpha);
    resolveCollisionsBottomToTop(nodes, y1, nodes.length - 1, alpha);
    resolveCollisionsTopToBottom(nodes, y0, 0, alpha);
  }

  // Push any overlapping nodes down.
  function resolveCollisionsTopToBottom(
    nodes: any,
    y: any,
    i: any,
    alpha: any
  ) {
    for (; i < nodes.length; ++i) {
      const node = nodes[i];
      const dy = (y - node.y0) * alpha;
      if (dy > 1e-6) (node.y0 += dy), (node.y1 += dy);
      y = node.y1 + py;
    }
  }

  // Push any overlapping nodes up.
  function resolveCollisionsBottomToTop(
    nodes: any,
    y: any,
    i: any,
    alpha: any
  ) {
    for (; i >= 0; --i) {
      const node = nodes[i];
      const dy = (node.y1 - y) * alpha;
      if (dy > 1e-6) (node.y0 -= dy), (node.y1 -= dy);
      y = node.y0 - py;
    }
  }

  function reorderNodeLinks({
    sourceLinks,
    targetLinks,
  }: {
    sourceLinks: any;
    targetLinks: any;
  }) {
    if (linkSort === undefined) {
      for (const {
        source: { sourceLinks },
      } of targetLinks) {
        sourceLinks.sort(ascendingTargetBreadth);
      }
      for (const {
        target: { targetLinks },
      } of sourceLinks) {
        targetLinks.sort(ascendingSourceBreadth);
      }
    }
  }

  function reorderLinks(nodes: any) {
    if (linkSort === undefined) {
      for (const { sourceLinks, targetLinks } of nodes) {
        sourceLinks.sort(ascendingTargetBreadth);
        targetLinks.sort(ascendingSourceBreadth);
      }
    }
  }

  // Returns the target.y0 that would produce an ideal link from source to target.
  function targetTop(source: any, target: any) {
    let y = source.y0 - ((source.sourceLinks.length - 1) * py) / 2;
    for (const { target: node, width } of source.sourceLinks) {
      if (node === target) break;
      y += width + py;
    }
    for (const { source: node, width } of target.targetLinks) {
      if (node === source) break;
      y -= width;
    }
    return y;
  }

  // Returns the source.y0 that would produce an ideal link from source to target.
  function sourceTop(source: any, target: any) {
    let y = target.y0 - ((target.targetLinks.length - 1) * py) / 2;
    for (const { source: node, width } of target.targetLinks) {
      if (node === source) break;
      y += width + py;
    }
    for (const { target: node, width } of source.sourceLinks) {
      if (node === target) break;
      y -= width;
    }
    return y;
  }

  return sankey;
}
