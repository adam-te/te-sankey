import { scaleLinear } from "d3-scale"
import { SankeyGraph } from "../sankeyUtils"
import { DisplaySankeyColumn } from "./models"

/**
 * Inserts the "merged" links that extend from selected columns. This is
 * statically defined after the regular sankey layout algorithm.
 */
export function insertStaticLinks({
  graph,
  selectedNodeIds,
  graphHeight,
  linkXPadding,
}: {
  graph: SankeyGraph
  selectedNodeIds: string[]
  graphHeight: number
  linkXPadding: number
}) {
  const selectedColumns = graph.columns.slice(0, selectedNodeIds.length)
  for (const [columnIdx, column] of [...selectedColumns.entries()].reverse() as [
    number,
    DisplaySankeyColumn
  ][]) {
    const nextColumn = graph.columns[columnIdx + 1] as DisplaySankeyColumn

    // Selected columns should have only one node
    const sourceNode = column.nodes[0]
    const nextColumnFirstNode = nextColumn.nodes[0]
    const nextColumnLastNode = nextColumn.nodes.at(-1)

    // TODO: More succint utility for this
    if (
      !nextColumnLastNode ||
      !sourceNode ||
      !column.flows ||
      sourceNode.x1 == null ||
      sourceNode.y0 == null ||
      sourceNode.y1 == null ||
      nextColumnFirstNode.x0 == null ||
      nextColumnFirstNode.y0 == null ||
      nextColumnLastNode.y1 == null
    ) {
      throw new Error("Input is invalid!")
    }

    const scale = scaleLinear().domain([0, column.flows.total]).range([0, graphHeight])

    // NOTE: Mock link for presentation purposes only
    // @ts-ignore
    const staticLink: SankeyLink = {
      // @ts-ignore
      isStaticLink: true,
      source: sourceNode,
      target: nextColumnFirstNode,
      value: 1,
      start: {
        x: sourceNode.x1 + linkXPadding,
        y0: sourceNode.y0,
        // y1: sourceNode.y1,
        // @ts-ignore
        y1: scale(column.flows.visible),
      },
      end: {
        x: nextColumnFirstNode.x0 - linkXPadding,
        y0: nextColumnFirstNode.y0,
        // @ts-ignore
        y1:
          nextColumnFirstNode === nextColumnLastNode ? nextColumnFirstNode.linksEndY : nextColumnLastNode.y1,
      },
    }
    sourceNode.linksEndY = staticLink.start?.y1
    graph.links.push(staticLink)
  }
}
