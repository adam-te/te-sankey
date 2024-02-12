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
        class="sankey-node"
      />
      <!-- Labels -->
      <text
        v-for="node of visibleNodes"
        :key="node.name"
        :transform="`translate(${node.x0 + getNodeWidth(node) / 2}, ${
          node.y0 + getNodeHeight(node) / 2
        }) rotate(-90)`"
        class="sankey-label"
      >
        {{ node.id }}
      </text>
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
const sourceSubnet1 = n("sourceSubnet1");
const sourceSubnet2 = n("sourceSubnet2");
const sourceSubnet3 = n("sourceSubnet3");
const sourceSubnet4 = n("sourceSubnet4");
const sourceSubnet5 = n("sourceSubnet5");

const targetSubnet1 = n("targetSubnet1");
const targetSubnet2 = n("targetSubnet2");
const targetSubnet3 = n("targetSubnet3");
const targetSubnet4 = n("targetSubnet4");
const targetSubnet5 = n("targetSubnet5");
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

const output = computeSankey(mockGraph, {
  numberOfVisibleRows: 4,
  extent: [
    [0, 0],
    [containerMeta.width, containerMeta.height],
  ],
});

const visibleNodes = output.nodes.filter((v) => !v.isHidden);
const visibleLinks = output.links.filter(
  (v) => !v.source.isHidden && !v.target.isHidden
);
function g() {
  const nodes = [];
  const links = [];
  return {
    n,
    l,
    nodes,
    links,
  };
  function n(id) {
    const node = {
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

function getNodeWidth(node) {
  return node.x1 - node.x0;
}

function getNodeHeight(node) {
  return node.y1 - node.y0;
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

.sankey-node {
  fill: var(--sankeyNodeActiveFlowColor);
}

.sankey-label {
  fill: var(--sankeyNodeLabelColor);
  font-size: 12px;
}
</style>
