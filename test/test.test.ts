import { expect, test } from "vitest";
// import { sankey } from "../src";
import { computeSankey } from "../src";
// import { setNodeDepths } from "../src/adamSankey";
// import { sum } from './sum'

// A ->(100) B
test("should produce a basic sankey", () => {
  const r = computeSankey({
    nodes: [{ id: "A" }, { id: "B" }],
    links: [
      {
        sourceId: "A",
        targetId: "B",
        value: 1,
      },
    ],
  });

  expect(r).toEqual({});

  // const graph = {
  //   nodes: ["A", "B"],
  //   links: [["A", "B"]],
  // };

  // // Gets mutated
  // const rawGraph = {
  //   nodes: [{ name: "A" }, { name: "B" }],
  //   links: [{ source: 0, target: 1, value: 1 }],
  // };
  // const s = sankey().extent([
  //   [0, 100],
  //   [0, 100],
  // ]);
  // s(rawGraph);
  // expect(1 + 2).toBe(3);
});
