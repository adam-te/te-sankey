import { SankeyColumn, SankeyGraph } from "../sankeyUtils"
import { DisplaySankeyGraph } from "./models"

/**
 * Returns just the "visible" elements of the graph, as determined by which graph objects
 * Have the "isHidden" property of true.
 *
 * Also returns a presentational version of the SankeyGraph with some additional properties
 */
export function getVisibleGraph(graph: SankeyGraph): DisplaySankeyGraph {
  const visibleLinks = graph.links.filter(v => !v.isHidden)
  const visibleNodes = graph.nodes
    .filter(v => !v.isHidden)
    .map(v => ({
      ...v,
      sourceLinks: v.sourceLinks.filter(v => !v.isHidden),
      targetLinks: v.targetLinks.filter(v => !v.isHidden),
    }))
  const nodeIdToVisibleNode = new Map(visibleNodes.map(n => [n.id, n]))

  return {
    nodes: visibleNodes,
    links: visibleLinks,
    // @ts-ignore
    columns: graph.columns.map(c => ({
      ...c,
      hasHiddenTopNodes: hasHiddenTopNodes(c),
      hasHiddenBottomNodes: hasHiddenBottomNodes(c),
      // @ts-ignore
      flows: c.flows,
      nodes: c.nodes
        .filter(node => nodeIdToVisibleNode.has(node.id))
        .map(node => nodeIdToVisibleNode.get(node.id)),
    })),
  }
}

function hasHiddenTopNodes(column: SankeyColumn): boolean {
  return Boolean(column.nodes.length && column.visibleRows[0] > 0)
}

function hasHiddenBottomNodes(column: SankeyColumn): boolean {
  return Boolean(column.nodes.length && column.visibleRows[1] < column.nodes.length)
}
