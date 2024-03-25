import {
  ComputeSankeyGroupingOptions,
  SubnetData,
  computeSankeyGrouping,
  sortToMinimizeLinkCrossings,
} from "."
import { SankeyColumn, computeSankey } from "../sankeyUtils"
import { computeFocusGraph } from "./computeFocusGraph"
import { getVisibleGraph } from "./getVisibleGraph"
import { insertStaticLinks } from "./insertStaticLinks"

export function computeDisplaySankey({
  subnetData,
  groupingOptions,
  graphWidth,
  graphHeight,
  sourceTargetPadding,
}: {
  subnetData: SubnetData
  groupingOptions: ComputeSankeyGroupingOptions
  graphWidth: number
  graphHeight: number
  sourceTargetPadding: number
}) {
  // const rawSankeyGrouping = computeSankeyGrouping(subnetData, groupingOptions)
  // const sankeyGrouping = computeSankeyGrouping(subnetData, groupingOptions)

  // TODO: Merge this with computeSankeyGrouping and do it first
  const sankeyGrouping = computeFocusGraph({
    graph: computeSankeyGrouping(subnetData, groupingOptions),
    selectedNodeIds: groupingOptions.selectedNodeIds,
  })

  sortToMinimizeLinkCrossings({
    columns: sankeyGrouping.columns,
    numberOfIterations: 6,
  })

  setSourceTargetPadding(sankeyGrouping.columns)

  const linkXPadding = 5
  const nodeYPadding = 8
  const graph = getVisibleGraph(
    computeSankey(sankeyGrouping, {
      width: graphWidth,
      height: graphHeight,
      linkXPadding,
      nodeYPadding,
    })
  )

  insertStaticLinks({
    graph,
    graphHeight,
    linkXPadding,
    selectedNodeIds: groupingOptions.selectedNodeIds,
  })

  return graph

  /** Add wider gap between sources and targets */
  function setSourceTargetPadding(columns: SankeyColumn[]): void {
    const lastSourceColumn = columns.filter(c => !c.isTarget).at(-1)
    if (!lastSourceColumn) {
      throw new Error("Source columns must be defined!")
    }
    lastSourceColumn.rightPadding = sourceTargetPadding
  }
}
