import { ScaleLinear, scaleLinear } from "d3-scale"
import { getNodeTotalFlowValue } from "./utils"
import { positionLinks } from "./positionLinks"
import { SankeyColumn, SankeyConfig, SankeyNode } from "./models"

export function positionNode({
  x,
  y0,
  yScale,
  column,
  node,
  sankeyConfig,
}: {
  x: number
  y0: number
  yScale: ScaleLinear<number, number>
  column: SankeyColumn
  node: SankeyNode
  sankeyConfig: SankeyConfig
}) {
  const nodeHeight =
    yScale(column.staticLink ? column.staticLink.totalValue : getNodeTotalFlowValue(node)) -
    sankeyConfig.nodeYPadding

  Object.assign(node, {
    x0: x,
    x1: x + sankeyConfig.nodeWidth,
    y0: y0,
    y1: y0 + nodeHeight,
  })

  // ADAMTODO:(perf)
  const linkHeightScale = computeLinkHeightScale(node)

  if (column.staticLink) {
    // console.log(column)
    console.log(
      column.id,
      column.staticLink,
      yScale(column.staticLink.visibleValue),
      column.staticLink.totalValue > column.staticLink.visibleValue
    )
    node.linksEndY = yScale(column.staticLink.visibleValue)
    // node.linksEndY = yScale(Math.min(column.staticLink.visibleValue, column.staticLink.totalValue))
  } else {
    node.linksEndY = positionLinks({
      x,
      y0,
      linkHeightScale,
      links: node.sourceLinks.filter(v => !v.isHidden),
      sankeyConfig: {
        ...sankeyConfig,
        linkXPadding: sankeyConfig.linkXPadding + sankeyConfig.nodeWidth,
      },
      type: "start",
    }).linksEndY

    positionLinks({
      x,
      y0,
      linkHeightScale,
      links: node.targetLinks.filter(v => !v.isHidden),
      sankeyConfig: {
        ...sankeyConfig,
        linkXPadding: -sankeyConfig.linkXPadding,
      },
      type: "end",
    })
  }

  return {
    nodeHeight,
  }
}

function computeLinkHeightScale(node: SankeyNode): ScaleLinear<number, number> {
  if (node.y0 == null || node.y1 == null) {
    throw new Error("node.(y0, y1) must be defined!")
  }
  const maxSourceValue = node.sourceLinks.reduce((a, v) => a + v.value, 0)
  const maxTargetValue = node.targetLinks.reduce((a, v) => a + v.value, 0)
  return scaleLinear()
    .range([0, node.y1 - node.y0])
    .domain([0, Math.max(maxSourceValue, maxTargetValue)])
  // TODO(perf), pre-compute this
  // const maxSourceValue = node.sourceLinks.reduce((a, v) => a + v.value, 0)
  // const maxTargetValue = node.targetLinks.reduce((a, v) => a + v.value, 0)
  // return scaleLinear()
  //   .range([0, node.y1 - node.y0])
  //   .domain([0, Math.max(maxSourceValue, maxTargetValue)])
}

// function sum() {}
