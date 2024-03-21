<template>
  <div>
    <div style="display: inline-block; margin-left: 300px">
      <div><label for="networkSourceOptions">Source Grouping</label></div>
      <select
        name="networkSourceOptions"
        id="networkSourceOptions"
        :value="computeSankeyGroupingOptions.sourceGroupType"
        @change="onSourceGroupingChanged($event.target.value)"
      >
        <option value="REGION">Region</option>
        <option value="VPC">VPC</option>
        <option value="SUBNET">Subnet</option>
      </select>
    </div>

    <div style="display: inline-block; margin-left: 20px; margin-bottom: 20px">
      <div><label for="networkTargetOptions">Destination Grouping</label></div>
      <select
        name="networkTargetOptions"
        id="networkTargetOptions"
        :value="computeSankeyGroupingOptions.targetGroupType"
        @change="onTargetGroupingChanged($event.target.value)"
      >
        <option value="REGION">Region</option>
        <option value="VPC">VPC</option>
        <option value="SUBNET">Subnet</option>
      </select>
    </div>

    <div class="sankey-row-btn-container top">
      <button
        class="sankey-row-btn ttt"
        :style="{ left: `${sankey.columns[0].nodes[0].x0}px` }"
      >
        ◀
      </button>
      <button
        v-for="button of getTopButtons(sankey)"
        class="sankey-row-btn"
        :style="{ left: `${button.x}px` }"
        @click="button.onClick"
      >
        ▲
      </button>
      <button
        class="sankey-row-btn ttt"
        :style="{ left: `${sankey.columns.at(-1).nodes[0].x0}px` }"
      >
        ▶
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
          @click="onSankeyNodeClicked(node)"
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

<script setup lang="ts">
import { ref } from "vue";
import { computeSankey, computeSankeyLinkPath } from "../src/sankey";
import rawData from "./data.json";
import {
  ComputeSankeyGroupingOptions,
  computeSankeyGrouping,
  computeWiredGraph,
} from "../src/utils";
import { SankeyNode } from "../src/models";

const data = computeWiredGraph(rawData);

const drawCounter = ref(0);
const containerMeta = {
  width: 1600,
  height: 600,
};

// const sankey = mockGraph.get();

let visibleNodes;
let visibleLinks;
let sankey;
const computeSankeyGroupingOptions: ComputeSankeyGroupingOptions = {
  sourceGroupType: "REGION",
  targetGroupType: "REGION",
  focusedNode: undefined,
  columnSpecs: [
    { id: "SOURCE_REGION", visibleRows: [0, 4] },
    { id: "SOURCE_VPC", visibleRows: [0, 4] },
    { id: "SOURCE_SUBNET", visibleRows: [0, 4] },
    { id: "TARGET_SUBNET", visibleRows: [0, 4] },
    { id: "TARGET_VPC", visibleRows: [0, 4] },
    { id: "TARGET_REGION", visibleRows: [0, 4] },
  ],
};

updateSankey();
function updateSankey() {
  const sankeyGrouping = computeSankeyGrouping(
    data,
    computeSankeyGroupingOptions
  );
  sankey = computeSankey(sankeyGrouping, {
    graphMeta: containerMeta,
    linkXPadding: 3,
  });

  const visibleGraph = getVisibleGraph(sankey);
  for (const col of visibleGraph.columns) {
    if (!col.mergeLinks) {
      continue;
    }
    const colLinks = col.nodes.flatMap((v) => v.sourceLinks);
    if (!colLinks.length) {
      continue;
    }

    // Remove existing links
    visibleGraph.links = visibleGraph.links.filter(
      (l) => !colLinks.includes(l)
    );
    const topLink = colLinks[0];
    const bottomLink = colLinks.at(-1);
    visibleGraph.links.push({
      // TODO:
      source: { name: "placeholder" },
      target: { name: "placeholder" },
      start: {
        x: topLink.start.x,
        y0: topLink.start.y0,
        y1: bottomLink.start.y1,
      },
      end: {
        x: bottomLink.end.x,
        y0: topLink.end.y0,
        y1: bottomLink.end.y1,
      },
    });
  }
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

  function l(from, to, props = {}) {
    const link = {
      source: from,
      target: to,
      value: 1,
      ...props,
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
  const visibleLinks = graph.links.filter((v) => !v.isHidden);
  return {
    nodes: graph.nodes
      .filter((v) => !v.isHidden)
      .map((v) => ({
        ...v,
        sourceLinks: v.sourceLinks.filter((v) => !v.isHidden),
        targetLinks: v.targetLinks.filter((v) => !v.isHidden),
      })),
    links: visibleLinks,
    // TODO:
    columns: graph.columns.map((c) => ({
      ...c,
      nodes: c.nodes
        .filter((v) => !v.isHidden)
        .map((v) => ({
          ...v,
          sourceLinks: v.sourceLinks.filter((v) => !v.isHidden),
          targetLinks: v.targetLinks.filter((v) => !v.isHidden),
        })),
    })),
  };
}

function onSankeyNodeClicked(node: SankeyNode) {
  computeSankeyGroupingOptions.focusedNode = node.id;
  updateSankey();
  drawCounter.value += 1;
}

function onSourceGroupingChanged(newValue) {
  computeSankeyGroupingOptions.sourceGroupType = newValue;
  computeSankeyGroupingOptions.focusedNode = undefined;
  updateSankey();
  drawCounter.value += 1;
}

function onTargetGroupingChanged(newValue) {
  computeSankeyGroupingOptions.targetGroupType = newValue;
  computeSankeyGroupingOptions.focusedNode = undefined;
  updateSankey();
  drawCounter.value += 1;
}

// Get top buttons
function getTopButtons() {
  const r = sankey.columns
    .filter((c) => c.nodes.length && c.visibleRows[0] > 0)
    .map((c) => {
      const button = {
        x: c.nodes.find((v) => v.x0 != null).x0,
        onClick() {
          const range =
            computeSankeyGroupingOptions.visibleRowState[c.columnIdx];
          range[0] -= 1;
          range[1] -= 1;
          updateSankey();

          drawCounter.value += 1;
        },
      };

      return button;
    });

  return r;
}

function getBottomButtons() {
  const r = sankey.columns
    .filter((c) => c.nodes.length && c.visibleRows[1] < c.nodes.length)
    .map((c) => {
      return {
        x: c.nodes.find((v) => v.x0 != null).x0,
        onClick() {
          const range =
            computeSankeyGroupingOptions.visibleRowState[c.columnIdx];
          range[0] += 1;
          range[1] += 1;
          updateSankey();
          drawCounter.value += 1;
        },
      };
    });
  return r;
}
</script>

<style>
:root {
  --sankeyLinkColor: #c9def0;
  --sankeyLinkOpacity: 0.85;

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
  filter: brightness(115%);
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
