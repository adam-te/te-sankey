<template>
  <div>
    <div>{{ message }}</div>

    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <!-- Nodes -->
      <g v-for="node in nodes" :key="node.name">
        <rect
          :x="node.x0"
          :y="node.y0"
          :width="node.x1 - node.x0"
          :height="node.y1 - node.y0"
          fill="navy"
        />
        <text :x="node.x0 + 10" :y="node.y0 + 14" fill="white" font-size="12px">
          {{ node.name }}
        </text>
      </g>

      <!-- Link -->
      <!-- <path
        v-for="link in links"
        :key="link.source.name + '_' + link.target.name"
        :d="computeSankeyLinkD(mockLink)"
        fill="none"
        stroke="black"
        :stroke-width="mockLink.width"
      /> -->

      <!--  -->
      <path
        v-for="link in links"
        :key="link.source.name + '_' + link.target.name"
        :d="computeSankeyLinkPath(link)"
        fill="black"
      />
      <!-- :stroke-width="Math.max(link.sourceHeight, link.targetHeight)" -->
    </svg>
  </div>
</template>

<script setup>
import { computeSankey, computeSankeyLinkPath } from "../src/sankey";
// import { computeSankeyLinkD } from "../src/sankeyLinkHorizontal";
// @ts-ignore
import { ref } from "vue";

const mockSource = {
  x0: 10,
  x1: 70,
  y0: 30,
  y1: 50,
  name: "Node A",
};
const mockTarget = {
  x0: 300,
  x1: 360,
  y0: 130,
  y1: 150,
  name: "Node B",
};

const mockLink = {
  source: mockSource,
  target: mockTarget,
  y0: 40,
  y1: 140,
  sourceHeight: 20,
  targetHeight: 20,
};

const nodes = [mockSource, mockTarget];
const links = [mockLink];

const message = ref("Hello, World!");

const graph = computeSankey(
  {
    nodes: [n("A"), n("B"), n("C")],
    links: [l("A", "B"), l("B", "C")],
  },
  {
    visibleColumnsFromCenter: 1,
  }
);

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

// /**
//  * Generates SVG path data for a Sankey link with different endpoint heights.
//  *
//  * @param {Object} start - The start point { x, y, height }.
//  * @param {Object} end - The end point { x, y, height }.
//  * @returns {string} The SVG path data.
//  */
// // interface Typ {
// //   x: Number;
// //   y: Number;
// //   height: Number;
// // }
// function generateSankeyLinkPathWithCurves(start, end) {
//   // Calculate control points for smooth curves
//   const controlPointX1 = start.x + (end.x - start.x) / 3;
//   const controlPointX2 = start.x + (2 * (end.x - start.x)) / 3;

//   // Calculate the top and bottom points for the start and end
//   const startTop = start.y - start.height / 2;
//   const startBottom = start.y + start.height / 2;
//   const endTop = end.y - end.height / 2;
//   const endBottom = end.y + end.height / 2;

//   // Construct the path with Bezier curves
//   const pathData = [
//     `M${start.x},${startTop}`, // Move to start top
//     `C${controlPointX1},${startTop} ${controlPointX2},${endTop} ${end.x},${endTop}`, // Curve to end top
//     `L${end.x},${endTop}`, // Line to end top (for clarity, technically redundant)
//     `L${end.x},${endBottom}`, // Line to end bottom
//     `C${controlPointX2},${endBottom} ${controlPointX1},${startBottom} ${start.x},${startBottom}`, // Curve to start bottom
//     "Z", // Close path
//   ].join(" ");

//   return pathData;
// }
</script>
