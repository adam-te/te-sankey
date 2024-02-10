import { expect, test, describe } from "vitest";
import { setStartAndEnd } from "../src/sankeyUtils";
import { LinkMeta, NodeMeta } from "../src/models";

// Middle nodes are where depth === inverse depth
// Is it implicitly true that there will always be middle nodes like this?
// More simply... max-depth / 2 signifies middle

// Showing 4 columns per side...
// SOURCE if middleNode - 4 < node.depth
// DEST   if middleNode - 4 < node.inverseDepth

// TODO: Test invalid inputs. e.g. link without value... should throw
// TODO: sourceValue, targetValue
// TODO: Force columns, e.g. nodes A, B grouped

// ADAMTODO: y values need to be computed as part of algo
// Instead of x0, stack them
// ALGO
// for each sorted link in node, compute start: { y0, y1 } end { y0, y1 }
// compute scaling/scale for whole column, sort sourceValues by value, run value through scale

// LIST:
// update sankey algo from link.value -> single scale, to separate scale per source/target
// e.g. each column has its own scale computed from node with max value
describe("setStartAndEnd", () => {
  test("A -> B", () => {
    const link = {
      value: 10,
    };
    const nodeA = {
      id: "A",
      depth: 0,
      sourceLinks: [link],
      targetLinks: [],
    };
    const nodeB = { id: "B", depth: 1, sourceLinks: [], targetLinks: [link] };
    const nodes = [nodeA, nodeB];

    // @ts-ignore
    setStartAndEnd(nodes, {
      nodeWidth: 10,
      nodePadding: 0,
      extent: [
        [0, 0],
        [110, 100],
      ],
    });

    // Nodes
    expect(nodeA).toEqual({
      id: "A",
      depth: 0,
      sourceLinks: [link],
      targetLinks: [],
      x0: 30,
      y0: 0,
      x1: 40,
      y1: 100,
    });

    expect(link).toEqual({
      value: 10,
      start: {
        x: 40,
        y0: 0,
        y1: 100,
      },
      end: {
        x: 60,
        y0: 0,
        y1: 100,
      },
    });

    expect(nodeB).toEqual({
      id: "B",
      depth: 1,
      sourceLinks: [],
      targetLinks: [link],
      x0: 60,
      y0: 0,
      x1: 70,
      y1: 100,
    });
  });

  test("A ->(2x) B", () => {
    const linkA = {
      id: "A",
      value: 10,
    };
    const linkB = {
      id: "B",
      value: 5,
    };
    const nodeA = {
      id: "A",
      depth: 0,
      sourceLinks: [linkA, linkB],
      targetLinks: [],
    };
    const nodeB = {
      id: "B",
      depth: 1,
      sourceLinks: [],
      targetLinks: [linkA, linkB],
    };
    const nodes = [nodeA, nodeB];

    // @ts-ignore
    setStartAndEnd(nodes, {
      nodeWidth: 10,
      nodePadding: 0,
      extent: [
        [0, 0],
        [110, 100],
      ],
    });

    // Nodes
    expect(nodeA).toEqual({
      id: "A",
      depth: 0,
      sourceLinks: [linkA, linkB],
      targetLinks: [],
      x0: 30,
      y0: 0,
      x1: 40,
      y1: 100,
    });
    // @ts-ignore
    expect(linkA.start).toEqual({
      x: 40,
      y0: 0,
      y1: 66.66666666666666,
    });

    // @ts-ignore
    expect(linkB.start).toEqual({
      x: 40,
      y0: 66.66666666666666,
      y1: 99.99999999999999,
    });

    // @ts-ignore
    expect(linkA.end).toEqual({
      x: 60,
      y0: 0,
      y1: 66.66666666666666,
    });

    // @ts-ignore
    expect(linkB.end).toEqual({
      x: 60,
      y0: 66.66666666666666,
      y1: 99.99999999999999,
    });

    expect(nodeB).toEqual({
      id: "B",
      depth: 1,
      sourceLinks: [],
      targetLinks: [linkA, linkB],
      x0: 60,
      y0: 0,
      x1: 70,
      y1: 100,
    });
  });

  test("AonB -> C", () => {
    const linkA = {
      id: "A",
      value: 10,
    };
    const linkB = {
      id: "B",
      value: 5,
    };
    const nodeA = {
      id: "A",
      depth: 0,
      sourceLinks: [linkA],
      targetLinks: [],
    };
    const nodeB = {
      id: "B",
      depth: 0,
      sourceLinks: [linkB],
      targetLinks: [],
    };
    const nodeC = {
      id: "C",
      depth: 1,
      sourceLinks: [],
      targetLinks: [linkA, linkB],
    };
    const nodes = [nodeA, nodeB, nodeC];

    // @ts-ignore
    setStartAndEnd(nodes, {
      nodeWidth: 10,
      nodePadding: 0,
      extent: [
        [0, 0],
        [110, 100],
      ],
    });

    // Nodes
    expect(nodeA).toEqual({
      id: "A",
      depth: 0,
      sourceLinks: [linkA],
      targetLinks: [],
      x0: 30,
      y0: 0,
      x1: 40,
      y1: 66.66666666666666,
    });
    expect(nodeB).toEqual({
      id: "B",
      depth: 0,
      sourceLinks: [linkB],
      targetLinks: [],
      x0: 30,
      y0: 66.66666666666666,
      x1: 40,
      y1: 99.99999999999999,
    });

    // @ts-ignore
    expect(linkA.start).toEqual({
      x: 40,
      y0: 0,
      y1: 66.66666666666666,
    });

    // @ts-ignore
    expect(linkB.start).toEqual({
      x: 40,
      y0: 66.66666666666666,
      y1: 99.99999999999999,
    });

    // @ts-ignore
    expect(linkA.end).toEqual({
      x: 60,
      y0: 0,
      y1: 66.66666666666666,
    });

    // @ts-ignore
    expect(linkB.end).toEqual({
      x: 60,
      y0: 66.66666666666666,
      y1: 99.99999999999999,
    });
  });
});

function getNodeDetails(node: Required<NodeMeta>) {
  return {
    id: node.id,
    depth: node.depth,
    width: node.x1 - node.x0,
    height: node.y1 - node.y0,
    // TODO: What is this height really? in the AonB -> C case, height is 1, 1, 0. Is it inverse of depth?
    // ht: node.height,
  };
}

function getLinkDetails(link: Required<LinkMeta>) {
  return {
    source: link.source.id,
    target: link.target.id,
    strokeWidth: link.width, // more like stroke-width
    y0: link.y0, // y value of left end of link band
    y1: link.y1, // y value of right end of link band
  };
}

function n(id) {
  return {
    id,
  };
}

function l(from, to) {
  return {
    sourceId: from,
    targetId: to,
    value: 1,
  };
}
