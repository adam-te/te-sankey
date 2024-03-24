<template>
  <div>
    <div class="sankey-scroll-btn-container top">
      <button
        v-if="focusedColumn !== sankeyGraph.columns[0]"
        class="sankey-scroll-btn"
        :disabled="true"
        :style="{
          left: `${getColumnX(sankeyGraph.columns[0])}px`,
        }"
      >
        ◀
      </button>
      <button
        v-if="focusedColumn"
        class="sankey-scroll-btn"
        :disabled="!hasHiddenTopNodes(focusedColumn)"
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
      <button
        v-if="focusedColumn !== sankeyGraph.columns.at(-1)"
        class="sankey-scroll-btn"
        :disabled="true"
        :style="{
          left: `${getColumnX(sankeyGraph.columns.at(-1))}px`,
        }"
      >
        ▶
      </button>
    </div>

    <svg
      ref="chartContainer"
      :width="props.width"
      :height="props.height"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <template v-for="node of visibleSankeyGraph.nodes" :key="node.id">
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

      <g class="links">
        <path
          v-for="link of visibleSankeyGraph.links"
          :key="link.source.name + '_' + link.target.name"
          :d="computeSankeyLinkPath(link)"
          class="sankey-link"
        />
      </g>

      <g class="nodes">
        <template v-for="node of visibleSankeyGraph.nodes" :key="node.name">
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
      </g>

      <g class="labels">
        <template v-for="node of visibleSankeyGraph.nodes" :key="node.name">
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
      </g>
    </svg>
    <div class="sankey-scroll-btn-container bottom">
      <button
        v-if="focusedColumn"
        class="sankey-scroll-btn"
        :disabled="!hasHiddenBottomNodes(focusedColumn)"
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
import {
  SankeyColumn,
  SankeyGraph,
  SankeyNode,
  computeSankey,
  computeSankeyLinkPath,
} from "../sankeyUtils"
import {
  computeWiredGraph,
  ComputeSankeyGroupingOptions,
  computeSankeyGrouping,
  RawSubnetData,
  SubnetData,
} from "."
// import { SankeyOptions } from "../sankeyUtils"
import { SankeyLink } from "../sankeyUtils"

const props = defineProps<{
  width: number
  height: number
  sourceTargetPadding: number
  data: RawSubnetData
  groupingOptions: ComputeSankeyGroupingOptions
}>()

const emits = defineEmits<{
  (event: "nodeClicked", payload: { nodeId: string }): void
  (
    event: "columnScrollClicked",
    payload: { column: SankeyColumn; direction: "UP" | "DOWN" }
  ): void
}>()

const data = computed<SubnetData>(() => {
  return computeWiredGraph(props.data)
})

const sankeyState = computed<{
  graph: SankeyGraph
  visibleGraph: SankeyGraph
  focusedColumn: SankeyColumn
}>(() => {
  const rawSankeyGrouping = computeSankeyGrouping(
    data.value,
    props.groupingOptions
  )

  const focusedColumn = getFocusedColumn({
    graph: rawSankeyGrouping,
    groupingOptions: props.groupingOptions,
  })

  const sankeyGrouping = rawSankeyGrouping
  // const sankeyGrouping = computeFocusGraph({
  //   graph: rawSankeyGrouping,
  //   focusedColumn,
  // })

  setSourceTargetPadding(sankeyGrouping.columns)

  const graph = computeSankey(sankeyGrouping, {
    width: props.width,
    height: props.height,
    linkXPadding: 3,
  })

  return {
    graph,
    visibleGraph: getVisibleGraph(graph),
    focusedColumn,
  }
})

const focusedColumn = computed(() => sankeyState.value.focusedColumn)
const sankeyGraph = computed(() => sankeyState.value.graph)
const visibleSankeyGraph = computed(() => sankeyState.value.visibleGraph)

// const focusedColumn = computed<SankeyColumn>(() => {
//   const { graph } = sankeyState.value
//   const focusedNodeColumnIdx = graph.columns.findIndex(c =>
//     c.nodes.some(n => n.id === props.groupingOptions?.focusedNodeId)
//   )

//   return graph.columns[focusedNodeColumnIdx + 1] || graph.columns[0]
// })

/** Focused column is the column "after" the focusedNode, or the first column if none */
function getFocusedColumn({
  graph,
  groupingOptions,
}: {
  graph: SankeyGraph
  groupingOptions: ComputeSankeyGroupingOptions
}): SankeyColumn {
  const focusedNodeColumnIdx = graph.columns.findIndex(c =>
    c.nodes.some(n => n.id === groupingOptions?.focusedNodeId)
  )

  return graph.columns[focusedNodeColumnIdx + 1] || graph.columns[0]
}

/**
 * derive flows from focusedColumn
 */

function getNodeWidth(node: SankeyNode) {
  if (node.x1 == null || node.x0 == null) {
    throw new Error("node.x0 and node.x1 must be defined!")
  }
  return node.x1 - node.x0
}

function getNodeHeight(node: SankeyNode) {
  if (node.y1 == null || node.y0 == null) {
    throw new Error("node.y0 and node.y1 must be defined!")
  }
  return node.y1 - node.y0
}

function getFlowsEndPercentage(node: SankeyNode) {
  // TODO: broken... linksEndY is undefined for target node. Is it right?
  //   if (node.y1 == null || node.y0 == null || node.linksEndY == null) {
  //     throw new Error("node.y0, node.y1 and node.linksEndY must be defined!");
  //   }
  return ((node.linksEndY - node.y0) / (node.y1 - node.y0)) * 100
}

function getVisibleGraph(graph: SankeyGraph): SankeyGraph {
  const visibleLinks = graph.links.filter(v => !v.isHidden)
  return {
    nodes: graph.nodes
      .filter(v => !v.isHidden)
      .map(v => ({
        ...v,
        sourceLinks: v.sourceLinks.filter(v => !v.isHidden),
        targetLinks: v.targetLinks.filter(v => !v.isHidden),
      })),
    links: visibleLinks,
    columns: graph.columns.map(c => ({
      ...c,
      nodes: c.nodes
        .filter(v => !v.isHidden)
        .map(v => ({
          ...v,
          sourceLinks: v.sourceLinks.filter(v => !v.isHidden),
          targetLinks: v.targetLinks.filter(v => !v.isHidden),
        })),
    })),
  }
}

function onSankeyNodeClicked(node: SankeyNode) {
  emits("nodeClicked", { nodeId: node.id })
}

function hasHiddenTopNodes(column: SankeyColumn): boolean {
  return Boolean(column.nodes.length && column.visibleRows[0] > 0)
}

function hasHiddenBottomNodes(column: SankeyColumn): boolean {
  return Boolean(
    column.nodes.length && column.visibleRows[1] < column.nodes.length
  )
}

function getColumnX(column: SankeyColumn): number | null {
  if (!column.nodes.length) {
    return null
  }
  // @ts-ignore
  return column.nodes.find(v => v.x0 != null).x0
}

/** Add wider gap between sources and targets */
function setSourceTargetPadding(columns: SankeyColumn[]): void {
  const lastSourceColumn = columns.filter(c => !c.isTarget).at(-1)
  if (!lastSourceColumn) {
    throw new Error("Source columns must be defined!")
  }
  lastSourceColumn.rightPadding = props.sourceTargetPadding
}

/**
 * Gets the "focus" graph, or the graph that is altered
 * taking into consideration the "focusedColumn".
 *
 * Effectively this just means, we clean up link presentation and filter
 * out nodes unrelated to the selected node.
 */
function computeFocusGraph({
  graph,
  focusedColumn,
}: {
  graph: SankeyGraph
  focusedColumn: SankeyColumn
}): SankeyGraph {
  const focusedColumnNodes = new Set(focusedColumn.nodes)

  const focusedLinks = graph.links.filter(isLinkFromFocusedColumn)
  const focusedNodes = getReachableNodes(
    focusedLinks.flatMap(l => [l.source, l.target])
  ).map(node => ({
    ...node,
    sourceLinks: node.sourceLinks.filter(isLinkFromFocusedColumn),
    targetLinks: node.targetLinks.filter(isLinkFromFocusedColumn),
  }))

  const nodeIdToNewNode = new Map<string, SankeyNode>(
    focusedNodes.map(v => [v.id, v])
  )
  const focusedColumns = graph.columns.map(v => ({
    ...v,
    nodes: v.nodes
      .filter(v => nodeIdToNewNode.has(v.id))
      .map(v => nodeIdToNewNode.get(v.id) as SankeyNode),
  }))

  // const focusedMergedLinks = new Set()
  // for (const column of graph.columns.filter(isNotFocusedColumn)) {
  //   const colLinks = column.nodes.flatMap(v => v.sourceLinks)
  //   if (!colLinks.length) {
  //     continue
  //   }
  //   const topLink = colLinks[0]
  //   const bottomLink = colLinks.at(-1)
  //   if (
  //     !topLink.start ||
  //     !topLink.end ||
  //     !bottomLink?.start ||
  //     !bottomLink?.end
  //   ) {
  //     throw new Error("Link start and end must be defined!")
  //   }

  //   focusedMergedLinks.add({
  //     // @ts-ignore
  //     source: "placeholder",
  //     // @ts-ignore
  //     target: "placeholder",
  //     value: 1,
  //     // INSTEAD put subnet
  //     // start: {
  //     //   x: topLink.start.x,
  //     //   y0: topLink.start.y0,
  //     //   y1: bottomLink.start.y1,
  //     // },
  //     // end: {
  //     //   x: bottomLink.end.x,
  //     //   y0: topLink.end.y0,
  //     //   y1: bottomLink.end.y1,
  //     // },
  //   })
  // }

  // for (const node of graph.nodes) {
  //   const focusNode = {
  //     ...node,
  //     sourceLinks: node.sourceLinks.filter(isLinkFromFocusedColumn),
  //     targetLinks: node.targetLinks.filter(isLinkFromFocusedColumn),
  //   }

  //   // Include node, if has any links OR is in graph of focused links
  //   const hasAnyLinks =
  //     focusNode.sourceLinks.length || focusNode.targetLinks.length
  //   if (hasAnyLinks) {
  //     focusedNodes.push(focusNode)
  //   }
  // }

  // Add mock links

  return {
    links: focusedLinks,
    nodes: focusedNodes,
    columns: focusedColumns,
  }

  function isNotFocusedColumn(column: SankeyColumn) {
    return column !== focusedColumn
  }

  function isLinkFromFocusedColumn(link: SankeyLink): boolean {
    return focusedColumnNodes.has(link.source)
  }
}

function getReachableNodes(startNodes: SankeyNode[]): SankeyNode[] {
  const visited = new Set<SankeyNode>()
  const stack: SankeyNode[] = [...startNodes]
  const reachableNodes = new Set<SankeyNode>()

  while (stack.length > 0) {
    const node = stack.pop() as SankeyNode
    if (visited.has(node)) {
      continue
    }

    visited.add(node)
    reachableNodes.add(node)

    for (const link of node.sourceLinks) {
      if (!visited.has(link.target)) {
        stack.push(link.target)
      }
    }

    for (const link of node.targetLinks) {
      if (!visited.has(link.source)) {
        stack.push(link.source)
      }
    }
  }

  return Array.from(reachableNodes)
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
