import { SankeyColumn, SankeyGraph, SankeyNode } from "../sankeyUtils"

/**
 * Gets the "focus" graph, or the graph that is altered
 * taking into consideration the "focusedColumn".
 *
 * Effectively this just means, we clean up link presentation and filter
 * out nodes unrelated to the selected node.
 * TODO: Merge with computeGroupedSubnets
 */
export function computeFocusGraph({
  graph,
  selectedNodeIds,
}: {
  graph: SankeyGraph
  selectedNodeIds: string[]
}): SankeyGraph {
  const selectedNodes = graph.nodes.filter(node => selectedNodeIds.includes(node.id))
  if (!selectedNodes.length) {
    return graph
  }

  const firstSelectedNodes = selectedNodes.slice(0, -1)
  const lastSelectedNode = selectedNodes.at(-1) as SankeyNode

  const reachableNodes = getReachableNodes(lastSelectedNode)
  const reachableNodeSet = new Set(reachableNodes)

  const reachableLinks = graph.links.filter(
    l => reachableNodeSet.has(l.source) && reachableNodeSet.has(l.target) && l.source !== lastSelectedNode
  )
  const reachableLinkSet = new Set(reachableLinks)

  const focusedNodes = [...firstSelectedNodes, ...reachableNodes].map(node => ({
    ...node,
    sourceLinks: node.sourceLinks.filter(l => reachableLinkSet.has(l)),
    targetLinks: node.targetLinks.filter(l => reachableLinkSet.has(l)),
  }))

  const nodeIdToNewNode = new Map<string, SankeyNode>(focusedNodes.map(v => [v.id, v]))
  const focusedColumns: SankeyColumn[] = []
  for (const column of graph.columns) {
    focusedColumns.push({
      ...column,
      nodes: column.nodes
        .filter(node => nodeIdToNewNode.has(node.id))
        .map(node => nodeIdToNewNode.get(node.id) as SankeyNode),
    })
  }

  return {
    links: reachableLinks,
    nodes: focusedNodes,
    columns: focusedColumns,
  }
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
  }

  return [...reachableNodes]
}
