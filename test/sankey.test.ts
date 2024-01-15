import { expect, test } from "vitest";
import { computeSankey } from "../src";
import { LinkMeta, NodeMeta } from "../src/sankey";

test("A -> B", () => {
  const nodeWidth = 10;
  const graph = computeSankey(
    {
      nodes: [{ id: "A" }, { id: "B" }],
      links: [
        {
          sourceId: "A",
          targetId: "B",
          value: 1,
        },
      ],
    },
    {
      // nodeHeight: 2,
      nodeWidth,
      extent: [
        [0, 0],
        [100, 100],
      ],
    }
  );

  // const result = getPrettified(r);

  expect(graph.nodes.length).toBe(2);
  expect(getNodeDetails(graph.nodes[0])).toEqual({
    id: "A",
    width: nodeWidth,
    height: 100,
    depth: 0,
  });
  expect(getNodeDetails(graph.nodes[1])).toEqual({
    id: "B",
    width: nodeWidth,
    height: 100,
    depth: 1,
  });

  expect(graph.links.length).toBe(1);
  expect(getLinkDetails(graph.links[0])).toEqual({
    source: "A",
    target: "B",
    strokeWidth: 100,
    y0: 50,
    y1: 50,
  });
});

// A -> C
// B ->
test("AonB -> C", () => {
  const nodeWidth = 10;
  const nodeHeight = 6;
  const maxHeight = 100;
  const graph = computeSankey(
    {
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
      links: [
        {
          sourceId: "A",
          targetId: "C",
          value: 1,
        },
        {
          sourceId: "B",
          targetId: "C",
          value: 1,
        },
      ],
    },
    {
      nodeWidth,
      nodeHeight,
      extent: [
        [0, 0],
        [100, maxHeight],
      ],
    }
  );

  // Nodes
  expect(graph.nodes.length).toBe(3);
  expect(getNodeDetails(graph.nodes[0])).toEqual({
    id: "A",
    width: nodeWidth,
    height: (maxHeight - nodeHeight) / 2, // Div by 2 because two nodes stacked
    depth: 0, // Column 1
  });
  expect(getNodeDetails(graph.nodes[1])).toEqual({
    id: "B",
    width: nodeWidth,
    height: (maxHeight - nodeHeight) / 2,
    depth: 0, // Column 1
  });
  expect(getNodeDetails(graph.nodes[2])).toEqual({
    id: "C",
    width: nodeWidth,
    height: maxHeight - nodeHeight,
    depth: 1, // Column 2
  });

  // Links
  expect(graph.links.length).toBe(2);
  expect(getLinkDetails(graph.links[0])).toEqual({
    source: "A",
    target: "C",
    strokeWidth: (maxHeight - nodeHeight) / 2,
    // TODO: work out formula
    y0: 23.5, // mid point of the top block
    y1: 26.5,
  });
  expect(getLinkDetails(graph.links[1])).toEqual({
    source: "B",
    target: "C",
    strokeWidth: (maxHeight - nodeHeight) / 2,
    y0: 76.5, // mid point of the bottom block
    y1: 73.5,
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
