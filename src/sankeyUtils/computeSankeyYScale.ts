import { scaleLinear } from "d3-scale"
import { SankeyConfig, SankeyGraph } from "."

export function computeSankeyYScale(
  graph: SankeyGraph,
  sankeyConfig: SankeyConfig
) {
  return scaleLinear()
    .domain([0, getGraphVisibleNodeFlowValue(graph)])
    .range([0, sankeyConfig.height])
}

function getGraphVisibleNodeFlowValue(graph: SankeyGraph) {
  const nodes = graph.columns[0].nodes

  let totalFlowValue = 0
  for (const node of nodes.filter(n => !n.isHidden)) {
    for (const link of node.sourceLinks) {
      totalFlowValue += link.value
    }
  }

  return totalFlowValue
}
