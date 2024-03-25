import { SubnetData } from "./models"
import { SankeyColumn, computeSankey } from "../sankeyUtils"
import { computeFocusGraph } from "./computeFocusGraph"
import { computeSankeyGrouping, ComputeSankeyGroupingOptions } from "./computeSankeyGrouping"
import { getVisibleGraph } from "./getVisibleGraph"
import { insertStaticLinks } from "./insertStaticLinks"
import { sortToMinimizeLinkCrossings } from "./sortToMinimizeLinkCrossings"

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
  // TODO: Merge computeFocusGraph with computeSankeyGrouping
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
