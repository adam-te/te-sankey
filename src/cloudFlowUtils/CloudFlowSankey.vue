<template>
  <div>
    <div class="sankey-scroll-btn-container top">
      <button
        v-if="focusedColumn !== sankeyGraph.columns[0]"
        class="sankey-scroll-btn"
        :style="{
          left: `${getColumnX(sankeyGraph.columns[0])}px`,
        }"
        @click="
          emits('columnScrollClicked', {
            column: focusedColumn,
            direction: 'LEFT',
          })
        "
      >
        ◀
      </button>
      <button
        v-if="focusedColumn"
        class="sankey-scroll-btn"
        :disabled="!focusedColumn.hasHiddenTopNodes"
        :style="{ left: `${getColumnX(focusedColumn)}px` }"
        @click="
          emits('columnScrollClicked', {
            column: focusedColumn,
            direction: 'UP',
          })
        "
      >
        ▲
      </button>
      <!-- <button
        v-if="focusedColumn !== sankeyGraph.columns.at(-1)"
        class="sankey-scroll-btn"
        :disabled="true"
        :style="{
          left: `${getColumnX(sankeyGraph.columns.at(-1))}px`,
        }"
      >
        ▶
      </button> -->
    </div>

    <svg ref="chartContainer" :width="props.width" :height="props.height" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <template v-for="node of sankeyGraph.nodes" :key="node.id">
          <linearGradient :id="node.id" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              class="flows-stop"
              :class="{ focus: !selectedNodeIds.has(node.id) }"
              :offset="`${getFlowsEndPercentage(node)}%`"
            />
            <stop
              class="no-flows-stop"
              :class="{ focus: !selectedNodeIds.has(node.id) }"
              :offset="`${getFlowsEndPercentage(node)}%`"
            />
          </linearGradient>
        </template>
      </defs>

      <g class="links">
        <path
          v-for="link of sankeyGraph.links"
          :key="link.source.id + '_' + link.target.id"
          :d="computeSankeyLinkPath(link)"
          class="sankey-link"
        />
      </g>

      <g class="nodes">
        <template v-for="node of sankeyGraph.nodes" :key="node.id">
          <rect
            :transform="`translate(${node.x0}, ${node.y0})`"
            :width="getNodeWidth(node)"
            :height="getNodeHeight(node)"
            class="sankey-node"
            rx="3"
            ry="3"
            @click="onSankeyNodeClicked(node)"
            :fill="`url(#${node.id})`"
            :class="{ focus: selectedNodeIds.has(node.id) }"
          />
        </template>
      </g>

      <g class="labels">
        <template v-for="node of sankeyGraph.nodes" :key="node.name">
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
            :transform="`translate(${node.x0 - 5}, ${node.y0 + getNodeHeight(node) / 2})`"
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
      </g>
    </svg>
    <div class="sankey-scroll-btn-container bottom">
      <button
        v-if="focusedColumn"
        class="sankey-scroll-btn"
        :disabled="!focusedColumn.hasHiddenBottomNodes"
        :style="{ left: `${getColumnX(focusedColumn)}px` }"
        @click="
          emits('columnScrollClicked', {
            column: focusedColumn,
            direction: 'DOWN',
          })
        "
      >
        ▼
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { SankeyColumn, SankeyGraph, SankeyNode, computeSankeyLinkPath } from "../sankeyUtils"
import { computeWiredGraph, ComputeSankeyGroupingOptions, RawSubnetData, SubnetData } from "."
import { DisplaySankeyGraph, DisplaySankeyColumn } from "./models"
import { computeDisplaySankey } from "./computeDisplaySankey"
import { getColumnX, getFlowsEndPercentage, getFocusedColumn, getNodeHeight, getNodeWidth } from "./utils"

const props = defineProps<{
  width: number
  height: number
  sourceTargetPadding: number
  data: RawSubnetData
  groupingOptions: ComputeSankeyGroupingOptions
}>()

const emits = defineEmits<{
  (event: "nodeClicked", payload: { graph: SankeyGraph; node: SankeyNode }): void
  (event: "columnScrollClicked", payload: { column: SankeyColumn; direction: "UP" | "DOWN" | "LEFT" }): void
}>()

const subnetData = computed<SubnetData>(() => {
  return computeWiredGraph(props.data)
})

const sankeyGraph = computed<DisplaySankeyGraph>(() => {
  return computeDisplaySankey({
    subnetData: subnetData.value,
    groupingOptions: props.groupingOptions,
    sourceTargetPadding: props.sourceTargetPadding,
    graphHeight: props.height,
    graphWidth: props.width,
  })
})

const focusedColumn = computed(
  () =>
    getFocusedColumn({
      columns: sankeyGraph.value.columns,
      selectedNodeIds: props.groupingOptions.selectedNodeIds,
    }) as DisplaySankeyColumn
)

const selectedNodeIds = computed(() => new Set(props.groupingOptions.selectedNodeIds))

function onSankeyNodeClicked(node: SankeyNode) {
  emits("nodeClicked", { graph: sankeyGraph.value, node })
}
</script>

<style>
:root {
  --sankeyLinkColor: #c9def0;
  --sankeyLinkOpacity: 0.4;
  --sankeyLinkHoveredOpacity: 0.9;

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
  opacity: var(--sankeyLinkHoveredOpacity);
}

.sankey-node {
  cursor: pointer;
}

.sankey-node:hover {
  filter: brightness(115%);
}

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

.sankey-scroll-btn-container {
  position: relative;
  height: 22px;
}

.sankey-scroll-btn-container.bottom {
  margin-top: -9px;
}

.sankey-scroll-btn {
  position: absolute;
  background-color: white;
  border: 1px solid black;
  border-radius: 4px;
  font-size: 8px;
  cursor: pointer;
  width: 25px;
  height: 20px;
}
</style>
