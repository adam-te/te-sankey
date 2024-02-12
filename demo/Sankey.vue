<template>
  <div>
    <!-- Transformed -->
    <svg
      ref="chartContainer"
      :width="containerMeta.width"
      :height="containerMeta.height"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Links -->
      <path
        v-for="link of visibleLinks"
        :key="link.source.name + '_' + link.target.name"
        :d="computeSankeyLinkPath(link)"
        class="sankey-link"
      />

      <!-- Nodes -->
      <rect
        v-for="node of visibleNodes"
        :key="node.name"
        :transform="`translate(${node.x0}, ${node.y0})`"
        :width="getNodeWidth(node)"
        :height="getNodeHeight(node)"
        class="sankey-node flows"
      />

      <!-- <rect
        v-for="node of displayNodes.activeNodes"
        :key="node.name"
        :transform="`translate(${node.x0}, ${node.y0})`"
        :width="getNodeWidth(node)"
        :height="getNodeHeight(node)"
        class="sankey-node flows"
      />

      <rect
        v-for="node of displayNodes.inactiveNodes"
        :key="node.name"
        :transform="`translate(${node.x0}, ${node.y0})`"
        :width="getNodeWidth(node)"
        :height="getNodeHeight(node)"
        class="sankey-node no-flows"
      /> -->
      <!-- Labels -->
      <template v-for="node of visibleNodes" :key="node.name">
        <text
          v-if="!node.label"
          :transform="`translate(${2 + node.x0 + getNodeWidth(node) / 2}, ${
            node.y0 + getNodeHeight(node) / 2
          }) rotate(-90)`"
          class="sankey-label"
        >
          {{ node.id }}
        </text>

        <text
          v-else-if="node.label === 'left'"
          :transform="`translate(${node.x0 - 5}, ${
            node.y0 + getNodeHeight(node) / 2
          })`"
          class="sankey-label left"
        >
          {{ node.id }}
        </text>

        <text
          v-else-if="node.label === 'right'"
          :transform="`translate(${node.x0 + getNodeWidth(node) + 5}, ${
            node.y0 + getNodeHeight(node) / 2
          })`"
          class="sankey-label right"
        >
          {{ node.id }}
        </text>
      </template>
    </svg>
  </div>
</template>

<script setup>
// import { notEqual } from "assert";
import { computeSankey, computeSankeyLinkPath } from "../src/sankey";
const containerMeta = {
  width: 1200,
  height: 600,
};

const mockGraph = g();
const { n, l } = mockGraph;
const sourceRegion = n("sourceRegion");
const sourceVpc = n("sourceVpc");
const sourceSubnet1 = n("sourceSubnet1", { label: "left" });
const sourceSubnet2 = n("sourceSubnet2", { label: "left" });
const sourceSubnet3 = n("sourceSubnet3", { label: "left" });
const sourceSubnet4 = n("sourceSubnet4", { label: "left" });
const sourceSubnet5 = n("sourceSubnet5", { label: "left" });

const targetSubnet1 = n("targetSubnet1", { label: "right" });
const targetSubnet2 = n("targetSubnet2", { label: "right" });
const targetSubnet3 = n("targetSubnet3", { label: "right" });
const targetSubnet4 = n("targetSubnet4", { label: "right" });
const targetSubnet5 = n("targetSubnet5", { label: "right" });
const targetVpc = n("targetVpc");
const targetRegion = n("targetRegion");

// Region (S)
l(sourceRegion, sourceVpc);

// VPC (S)
l(sourceVpc, sourceSubnet1);
l(sourceVpc, sourceSubnet2);
l(sourceVpc, sourceSubnet3);
l(sourceVpc, sourceSubnet4);
l(sourceVpc, sourceSubnet5);

// Subnets (S)
l(sourceSubnet1, targetSubnet1);
l(sourceSubnet1, targetSubnet2);
l(sourceSubnet1, targetSubnet4);
l(sourceSubnet1, targetSubnet4);

l(sourceSubnet2, targetSubnet1);

l(sourceSubnet3, targetSubnet1);
l(sourceSubnet3, targetSubnet2);

l(sourceSubnet4, targetSubnet3);
l(sourceSubnet4, targetSubnet4);

// Subnets (T)
l(targetSubnet1, targetVpc);
l(targetSubnet2, targetVpc);
l(targetSubnet4, targetVpc);
l(targetSubnet4, targetVpc);

// VPC (T)
l(targetVpc, targetRegion);

// Hidden (TODO: Create hidden flows here)
l(sourceSubnet5, targetSubnet5);

console.log("I", mockGraph.nodes);
const output = computeSankey(mockGraph, {
  numberOfVisibleRows: 4,
  extent: [
    [0, 0],
    [containerMeta.width, containerMeta.height],
  ],
});

console.log("O", output.nodes);
const { nodes: visibleNodes, links: visibleLinks } = getVisibleGraph(output);
// const visibleNodes = output.nodes.filter((v) => !v.isHidden);
// const visibleLinks = output.links.filter(
//   (v) => !v.source.isHidden && !v.target.isHidden
// );

// console.log(visibleLinks.map((l) => l.end));
// console.log(output.links.map((l) => l.end));
// const displayNodes = getDisplayNodes(visibleNodes);
console.log(visibleNodes);
function g() {
  const nodes = [];
  const links = [];
  return {
    n,
    l,
    nodes,
    links,
  };
  function n(id, props = {}) {
    const node = {
      ...props,
      id,
      sourceLinks: [],
      targetLinks: [],
    };
    nodes.push(node);
    return node;
  }

  function l(from, to) {
    const link = {
      sourceId: from.id,
      targetId: to.id,
      value: 1,
    };

    from.sourceLinks.push(link);
    to.targetLinks.push(link);
    links.push(link);
    return link;
  }
}

function getDisplayNodes(nodes) {
  const activeNodes = [];
  const inactiveNodes = [];
  for (const node of nodes) {
    if (!node.sourceLinks.length) {
      inactiveNodes.push(node);
      continue;
    }

    const maxY1 = 0;
    let maxLink = null;
    for (const link of node.sourceLinks) {
      if (link == null || link.end.y1 >= maxY1) {
        maxLink = link;
      }
    }
    const finalLink = maxLink;
    // const finalLink = node.sourceLinks.at(-1);

    activeNodes.push({
      x0: node.x0,
      x1: node.x1,
      y0: node.y0,
      // TODO:
      y1: finalLink.end.y1,
      // node,
    });

    const isNodeFullFlows = finalLink.end.y1 >= node.y1;
    if (!isNodeFullFlows) {
      // console.log(node.y1, finalLink.y1);
      inactiveNodes.push({
        x0: node.x0,
        x1: node.x1,
        y0: finalLink.end.y1,
        y1: node.y1,
      });
    }
  }

  return {
    activeNodes,
    inactiveNodes,
  };
}
function getNodeWidth(node) {
  return node.x1 - node.x0;
}

function getNodeHeight(node) {
  return node.y1 - node.y0;
}

function getVisibleGraph(graph) {
  return {
    nodes: graph.nodes
      .filter((v) => !v.isHidden)
      .map((v) => ({
        ...v,
        sourceLinks: v.sourceLinks.filter((v) => !v.isHidden),
        targetLinks: v.targetLinks.filter((v) => !v.isHidden),
      })),
    links: graph.links.filter((v) => !v.isHidden),
  };
}
</script>

<style>
:root {
  --sankeyLinkColor: #c9def0;
  --sankeyLinkOpacity: 0.9;
  --sankeyNodeActiveFlowColor: #2679c2;
  --sankeyNodeActiveNoFlowColor: #195386;
  --sankeyNodeInactiveFlowColor: #e0e5ea;
  --sankeyNodeInactiveNoFlowColor: #a6aeb8;
  --sankeyNodeLabelColor: #000;
}

.sankey-link {
  fill: var(--sankeyLinkColor);
  opacity: var(--sankeyLinkOpacity);
}

.sankey-node.flows {
  fill: var(--sankeyNodeActiveFlowColor);
}

.sankey-node.no-flows {
  fill: var(--sankeyNodeActiveNoFlowColor);
}

.sankey-label {
  fill: var(--sankeyNodeLabelColor);
  font-size: 12px;
}

.sankey-label.left {
  text-anchor: end;
}
</style>
