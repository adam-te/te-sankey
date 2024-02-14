<template>
  <div>
    <div class="sankey-row-btn-container top">
      <button
        v-for="button of getTopButtons(sankey)"
        class="sankey-row-btn"
        :style="{ left: `${button.x}px` }"
        @click="button.onClick"
      >
        ▲
      </button>
    </div>

    <svg
      ref="chartContainer"
      :width="containerMeta.width"
      :height="containerMeta.height"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <template v-for="node of visibleNodes" :key="node.id">
          <linearGradient :id="node.id" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              class="flows-stop"
              :class="{ focus: node.focus }"
              :offset="`${getFlowsEndPercentage(node)}%`"
            />
            <stop
              class="no-flows-stop"
              :class="{ focus: node.focus }"
              :offset="`${getFlowsEndPercentage(node)}%`"
            />
          </linearGradient>
        </template>
      </defs>

      <!-- Links -->
      <path
        v-for="link of visibleLinks"
        :key="link.source.name + '_' + link.target.name"
        :d="computeSankeyLinkPath(link)"
        class="sankey-link"
      />

      <!-- Nodes -->
      <template v-for="node of visibleNodes" :key="node.name">
        <rect
          :transform="`translate(${node.x0}, ${node.y0})`"
          :width="getNodeWidth(node)"
          :height="getNodeHeight(node)"
          class="sankey-node"
          rx="3"
          ry="3"
          :fill="`url(#${node.id})`"
          :class="{ focus: node.focus }"
        />
      </template>

      <!-- Labels -->
      <template v-for="node of visibleNodes" :key="node.name">
        <text
          v-if="!node.label"
          :transform="`translate(${2 + node.x0 + getNodeWidth(node) / 2}, ${
            node.y0 + getNodeHeight(node) / 2
          }) rotate(-90)`"
          class="sankey-label"
        >
          {{ node.displayName || node.id }}
        </text>

        <text
          v-else-if="node.label === 'left'"
          :transform="`translate(${node.x0 - 5}, ${
            node.y0 + getNodeHeight(node) / 2
          })`"
          class="sankey-label left"
        >
          {{ node.displayName || node.id }}
        </text>

        <text
          v-else-if="node.label === 'right'"
          :transform="`translate(${node.x0 + getNodeWidth(node) + 5}, ${
            node.y0 + getNodeHeight(node) / 2
          })`"
          class="sankey-label right"
        >
          {{ node.displayName || node.id }}
        </text>
      </template>
    </svg>
    <div class="sankey-row-btn-container bottom">
      <button
        v-for="button of getBottomButtons(sankey)"
        class="sankey-row-btn"
        :style="{ left: `${button.x}px` }"
        @click="button.onClick"
      >
        ▼
      </button>
    </div>
    <!-- TODO: Make drawing work better -->
    {{ drawCounter }}
  </div>
</template>

<script setup>
import { ref } from "vue";
import { computeSankey, computeSankeyLinkPath } from "../src/sankey";

const drawCounter = ref(0);
const containerMeta = {
  width: 1200,
  height: 600,
};

const mockGraph = g();
const { n, l, c } = mockGraph;
const sourceRegion = n("sourceRegion", { displayName: "us-east-2" });
const sourceVpc = n("sourceVpc", { displayName: "VPC ID 1" });
const sourceSubnet1 = n("sourceSubnet1", {
  label: "left",
  focus: true,
  displayName: "Subnet 1",
});
const sourceSubnet2 = n("sourceSubnet2", {
  label: "left",
  focus: true,
  displayName: "Subnet 2",
});
const sourceSubnet3 = n("sourceSubnet3", {
  label: "left",
  focus: true,
  displayName: "Subnet 3",
});
const sourceSubnet4 = n("sourceSubnet4", {
  label: "left",
  focus: true,
  displayName: "Subnet 4",
});
const sourceSubnet5 = n("sourceSubnet5", {
  label: "left",
  focus: true,
  displayName: "Subnet 5",
});

const targetSubnet1 = n("targetSubnet1", {
  label: "right",
  focus: true,
  displayName: "Subnet 1",
});
const targetSubnet2 = n("targetSubnet2", {
  label: "right",
  focus: true,
  displayName: "Subnet 2",
});
const targetSubnet3 = n("targetSubnet3", {
  label: "right",
  focus: true,
  displayName: "Subnet 3",
});
const targetSubnet4 = n("targetSubnet4", {
  label: "right",
  focus: true,
  displayName: "Subnet 4",
});
const targetSubnet5 = n("targetSubnet5", {
  label: "right",
  focus: true,
  displayName: "Subnet 5",
});
const targetVpc = n("targetVpc", { displayName: "VPC ID 1" });
const targetRegion = n("targetRegion", { displayName: "us-east-2" });

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
l(sourceSubnet1, targetSubnet3);
l(sourceSubnet1, targetSubnet4);

l(sourceSubnet2, targetSubnet1);

l(sourceSubnet3, targetSubnet1);
l(sourceSubnet3, targetSubnet2);

l(sourceSubnet4, targetSubnet3);
l(sourceSubnet4, targetSubnet4);

// Subnets (T)
l(targetSubnet1, targetVpc);
l(targetSubnet2, targetVpc);
l(targetSubnet3, targetVpc);
l(targetSubnet4, targetVpc);

// VPC (T)
l(targetVpc, targetRegion);

// Hidden (TODO: Create hidden flows here)
l(sourceSubnet5, targetSubnet1);
l(sourceSubnet5, targetSubnet2);
l(sourceSubnet5, targetSubnet3);
l(sourceSubnet5, targetSubnet4);
l(sourceSubnet5, targetSubnet5);

l(sourceSubnet1, targetSubnet5);
l(sourceSubnet2, targetSubnet5);
l(sourceSubnet3, targetSubnet5);
l(sourceSubnet4, targetSubnet5);

c([sourceRegion]);
c([sourceVpc]);
c([sourceSubnet1, sourceSubnet2, sourceSubnet3, sourceSubnet4, sourceSubnet5], {
  visibleRows: [0, 4],
  rightPadding: 300,
});

c([targetSubnet1, targetSubnet2, targetSubnet3, targetSubnet4, targetSubnet5], {
  visibleRows: [0, 4],
});
c([targetVpc]);
c([targetRegion]);

const sankey = mockGraph.get();

let output;
let visibleNodes;
let visibleLinks;
updateSankey();
function updateSankey() {
  // Clean graph (TODO: use immutable)
  sankey.nodes.forEach((n) => {
    n.isHidden = false;
  });
  sankey.links.forEach((l) => {
    l.isHidden = false;
  });
  output = computeSankey(sankey, {
    graphMeta: containerMeta,
    linkXPadding: 3,
  });

  const visibleGraph = getVisibleGraph(output);
  visibleNodes = visibleGraph.nodes;
  visibleLinks = visibleGraph.links;
}

function g() {
  const nodes = [];
  const links = [];
  const columns = [];
  return {
    n,
    l,
    c,
    nodes,
    links,
    columns,
    get,
  };

  function get() {
    return {
      links,
      nodes,
      columns,
    };
  }

  function c(nodes, props = {}) {
    const columnNodes = nodes.filter((n) => nodes.includes(n));
    if (columnNodes.length !== nodes.length) {
      throw new Error("Invalid input!");
    }
    const col = {
      visibleRows: [0, columnNodes.length],
      rightPadding: 0,
      nodes: columnNodes,
      ...props,
    };
    columns.push(col);
    return col;
  }

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
      source: from,
      target: to,
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

function getFlowsEndPercentage(node) {
  return ((node.linksEndY - node.y0) / (node.y1 - node.y0)) * 100;
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

// Get top buttons
function getTopButtons(sankey) {
  return sankey.columns
    .filter((c) => c.nodes.length && c.visibleRows[0] > 0)
    .map((c) => ({
      x: c.nodes[0].x0,
      onClick() {
        c.visibleRows[0] -= 1;
        c.visibleRows[1] -= 1;
        updateSankey();
        drawCounter.value += 1;
      },
    }));
}

function getBottomButtons(sankey) {
  const r = sankey.columns
    .filter((c) => c.nodes.length && c.visibleRows[1] < c.nodes.length)
    .map((c) => ({
      x: c.nodes[0].x0,
      onClick() {
        console.log("ROWS", c.visibleRows);
        c.visibleRows[0] += 1;
        c.visibleRows[1] += 1;
        updateSankey();
        drawCounter.value += 1;
      },
    }));
  return r;
}
</script>

<style>
:root {
  --sankeyLinkColor: #c9def0;
  --sankeyLinkOpacity: 0.9;

  --sankeyFlowNodeColor: #2679c2;
  --sankeyNoFlowNodeColor: #195386;
  --sankeyUnfocusedFlowNodeColor: #e0e5ea;
  --sankeyUnfocusedNoFlowNodeColor: #a6aeb8;

  --sankeyNodeLabelColor: #000;
}

.sankey-link {
  fill: var(--sankeyLinkColor);
  opacity: var(--sankeyLinkOpacity);
  cursor: pointer;
}

.sankey-link:hover {
  opacity: 1;
}

.sankey-node {
  cursor: pointer;
}

.sankey-node:hover {
  filter: brightness(110%);
}

/* .sankey-node.flows.focus {
    fill: var(--sankeyNodeActiveFlowColor);
  } */

.flows-stop.focus {
  stop-color: var(--sankeyFlowNodeColor);
}
.no-flows-stop.focus {
  stop-color: var(--sankeyNoFlowNodeColor);
}

.flows-stop {
  stop-color: var(--sankeyUnfocusedFlowNodeColor);
}
.no-flows-stop {
  stop-color: var(--sankeyUnfocusedNoFlowNodeColor);
}

.sankey-label {
  fill: var(--sankeyNodeLabelColor);
  font-size: 12px;
  pointer-events: none;
}

.sankey-label.left {
  text-anchor: end;
}

.sankey-row-btn-container {
  position: relative;
  height: 22px;
}

.sankey-row-btn-container.bottom {
  /* TODO */
  margin-top: -9px;
}

.sankey-row-btn {
  position: absolute;
  background-color: white;
  border: 1px solid black;
  border-radius: 4px;
  font-size: 8px;
  cursor: pointer;
  width: 25px;
  height: 20px;
}

/* .flows-stop {
    stop-color: blue;
    stop-opacity: 1;
  }
  
  .no-flows-stop {
    stop-color: red;
    stop-opacity: 1;
  } */
</style>
