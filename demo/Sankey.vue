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

    <CloudFlowSankey
      :width="1600"
      :height="600"
      :sourceTargetPadding="600"
      :data="rawData"
      :groupingOptions="computeSankeyGroupingOptions"
      @nodeClicked="onNodeClicked"
      @columnScrollClicked="onColumnScrollClicked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import rawData from "./data.json"
import CloudFlowSankey from "../src/cloudFlowUtils/CloudFlowSankey.vue"
import { ComputeSankeyGroupingOptions } from "../src/cloudFlowUtils"
import { SankeyColumn, SankeyGraph, SankeyNode } from "../src/sankeyUtils"

const computeSankeyGroupingOptions = ref<ComputeSankeyGroupingOptions>({
  sourceGroupType: "REGION",
  targetGroupType: "REGION",
  selectedNodeIds: [],
  columnSpecs: [
    { id: "SOURCE_REGION", visibleRows: [0, 4] },
    { id: "SOURCE_VPC", visibleRows: [0, 4] },
    { id: "SOURCE_SUBNET", visibleRows: [0, 4] },
    { id: "TARGET_SUBNET", visibleRows: [0, 4] },
    { id: "TARGET_VPC", visibleRows: [0, 4] },
    { id: "TARGET_REGION", visibleRows: [0, 4] },
  ],
})

function onSourceGroupingChanged(
  newValue: ComputeSankeyGroupingOptions["sourceGroupType"]
) {
  computeSankeyGroupingOptions.value = {
    ...computeSankeyGroupingOptions.value,
    sourceGroupType: newValue,
    selectedNodeIds: [],
  }
}

function onTargetGroupingChanged(
  newValue: ComputeSankeyGroupingOptions["targetGroupType"]
) {
  computeSankeyGroupingOptions.value = {
    ...computeSankeyGroupingOptions.value,
    targetGroupType: newValue,
    selectedNodeIds: [],
  }
}

function onNodeClicked({
  visibleGraph,
  node,
}: {
  visibleGraph: SankeyGraph
  node: SankeyNode
}) {
  const { selectedNodeIds } = computeSankeyGroupingOptions.value
  const nextColumnEligibleForFocus =
    visibleGraph.columns[selectedNodeIds.length]
  if (!nextColumnEligibleForFocus || nextColumnEligibleForFocus.isTarget) {
    return // don't allow selecting invalid nodes
  }

  computeSankeyGroupingOptions.value = {
    ...computeSankeyGroupingOptions.value,
    selectedNodeIds: [...selectedNodeIds, node.id],
  }
}

function onColumnScrollClicked({ column, direction }) {
  // Remove one level of selectedNodeIds
  if (direction === "LEFT") {
    computeSankeyGroupingOptions.value = {
      ...computeSankeyGroupingOptions.value,
      selectedNodeIds: computeSankeyGroupingOptions.value.selectedNodeIds.slice(
        0,
        -1
      ),
    }
    return
  }

  // Scroll the column
  const scrollOffset = direction === "UP" ? -1 : 1
  computeSankeyGroupingOptions.value = {
    ...computeSankeyGroupingOptions.value,
    columnSpecs: computeSankeyGroupingOptions.value.columnSpecs.map(c =>
      c.id === column.id
        ? {
            ...c,
            visibleRows: c.visibleRows.map(v => v + scrollOffset) as [
              number,
              number
            ],
          }
        : c
    ),
  }
}
</script>

<style></style>
