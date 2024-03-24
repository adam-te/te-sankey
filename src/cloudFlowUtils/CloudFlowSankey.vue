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
  sortToMinimizeLinkCrossings,
} from "."
// import { SankeyOptions } from "../sankeyUtils"
// import { SankeyLink, MergedSankeyLink } from "../sankeyUtils"

const props = defineProps<{
  width: number
  height: number
  sourceTargetPadding: number
  data: RawSubnetData
  groupingOptions: ComputeSankeyGroupingOptions
}>()

const emits = defineEmits<{
  (
    event: "nodeClicked",
    payload: { graph: SankeyGraph; node: SankeyNode }
  ): void
  (
    event: "columnScrollClicked",
    payload: { column: SankeyColumn; direction: "UP" | "DOWN" | "LEFT" }
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

  // const sankeyGrouping = rawSankeyGrouping
  const sankeyGrouping = computeFocusGraph({
    graph: rawSankeyGrouping,
    selectedNodeIds: props.groupingOptions.selectedNodeIds,
  })

  sortToMinimizeLinkCrossings({
    columns: sankeyGrouping.columns,
    numberOfIterations: 6,
  })
  // console.log(sankeyGrouping)

  setSourceTargetPadding(sankeyGrouping.columns)

  const graph = computeSankey(sankeyGrouping, {
    width: props.width,
    height: props.height,
    linkXPadding: 3,
  })

  console.log("VISIBLE GRAPH", getVisibleGraph(graph))
  const visibleGraph = getVisibleGraph(graph)
  return {
    graph,
    visibleGraph,
    // TODO: Cleanup, hacky
    focusedColumn: graph.columns.find(column => column.id === focusedColumn.id),
  }
})

const focusedColumn = computed(() => sankeyState.value.focusedColumn)
const sankeyGraph = computed(() => sankeyState.value.graph)
const visibleSankeyGraph = computed(() => sankeyState.value.visibleGraph)

/** Focused column is the column "after" the focusedNode, or the first column if none */
function getFocusedColumn({
  graph,
  groupingOptions,
}: {
  graph: SankeyGraph
  groupingOptions: ComputeSankeyGroupingOptions
}): SankeyColumn {
  const focusedNodeColumnIdx = graph.columns.findIndex(c =>
    c.nodes.some(n => n.id === groupingOptions?.selectedNodeIds.at(-1))
  )

  return graph.columns[focusedNodeColumnIdx + 1] || graph.columns[0]
}

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
  emits("nodeClicked", { visibleGraph: visibleSankeyGraph.value, node })
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
  selectedNodeIds,
}: {
  graph: SankeyGraph
  selectedNodeIds: string[]
}): SankeyGraph {
  // const focusedNodes = focusedNodeIds.map(id => )
  // const firstFocusedNodeId = focusedNodeIds?.[0]
  const selectedNodes = graph.nodes.filter(node =>
    selectedNodeIds.includes(node.id)
  )
  if (!selectedNodes.length) {
    return graph
  }

  const firstSelectedNodes = selectedNodes.slice(0, -1)
  const lastSelectedNode = selectedNodes.at(-1) as SankeyNode
  const reachableNodes = [
    ...firstSelectedNodes, // Include in graph, but not in reachable node traversal
    ...getReachableNodes(lastSelectedNode),
  ]
  const reachableNodeSet = new Set(reachableNodes)
  const reachableLinks = graph.links.filter(
    l => reachableNodeSet.has(l.source) && reachableNodeSet.has(l.target)
  )
  const reachableLinkSet = new Set(reachableLinks)

  const focusedNodes = reachableNodes.map(node => ({
    ...node,
    sourceLinks: node.sourceLinks.filter(l => reachableLinkSet.has(l)),
    targetLinks: node.targetLinks.filter(l => reachableLinkSet.has(l)),
  }))

  const nodeIdToNewNode = new Map<string, SankeyNode>(
    focusedNodes.map(v => [v.id, v])
  )
  const focusedColumns: SankeyColumn[] = []
  for (const column of graph.columns) {
    focusedColumns.push({
      ...column,
      nodes: column.nodes
        .filter(node => nodeIdToNewNode.has(node.id))
        .map(node => nodeIdToNewNode.get(node.id) as SankeyNode),
    })
  }

  // Insert merged link for non-focus columns
  // const sumFocusedColumnValue = focusedLinks.reduce(
  //   (sum, link) => sum + link.value,
  //   0
  // )
  // for (const [columnIdx, column] of focusedColumns.entries()) {
  //   const nextColumn = graph.columns[columnIdx + 1]
  //   if (!nextColumn || column.id === focusedColumn.id) {
  //     continue
  //   }
  //   //
  //   const mergedLink: MergedSankeyLink = {
  //     links: nextColumn.nodes
  //     // source: column.nodes[0],
  //     // target: nextColumn.nodes[0],
  //     // // Enforce that merged links reflect same flows as focusedColumn so flow between each column is equivalent.
  //     // // NOTE: That this means we are displaying potentially incorrect information. Revisit this
  //     // value: sumFocusedColumnValue,
  //   }

  //   console.log("INSERTING MERGED LINK", mergedLink)
  //   mergedLink.source.sourceLinks.push(mergedLink)
  //   mergedLink.target.targetLinks.push(mergedLink)
  //   focusedLinks.push(mergedLink)
  // }

  // Add mock links

  return {
    links: reachableLinks,
    nodes: focusedNodes,
    columns: focusedColumns,
  }

  // function isLinkFromFocusedColumn(link: SankeyLink): boolean {
  //   return focusedColumnNodes.has(link.source)
  // }
}

function getReachableNodes(startNode: SankeyNode): SankeyNode[] {
  const visited = new Set<SankeyNode>()
  const stack: SankeyNode[] = [startNode]
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

    // for (const link of node.targetLinks) {
    //   if (!visited.has(link.source)) {
    //     stack.push(link.source)
    //   }
    // }
  }

  return [...reachableNodes]
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
