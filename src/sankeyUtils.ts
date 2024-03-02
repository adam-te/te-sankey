import { SankeyColumn, SankeyConfig, SankeyGraph, SankeyNode } from "./models";
import { scaleLinear } from "d3-scale";

export function setStartAndEnd(graph: SankeyGraph, sankeyConfig: SankeyConfig) {
  const globalWidth = sankeyConfig.graphMeta.width;
  const globalHeight = sankeyConfig.graphMeta.height;

  //   const columns = computeNodeColumns(nodes);
  const spacingBetweenColumns = computeSpacingBetweenColumns(
    globalWidth,
    graph.columns,
    sankeyConfig
  );

  // TODO: Move back to loop
  markHiddenNodes(graph.columns);

  let x = spacingBetweenColumns;
  let columnIdx = 0;
  for (const column of graph.columns) {
    const visibleColumnNodes = column.nodes.slice(
      // @ts-ignore
      column.visibleRows[0],
      // @ts-ignore
      column.visibleRows[1]
    );

    const totalColumnFlowValue = getColumnTotalFlowValue(visibleColumnNodes);
    const yScale = scaleLinear()
      .domain([0, totalColumnFlowValue])
      .range([0, globalHeight]);

    let y0 = 0;
    let rowCount = 1;
    for (const node of visibleColumnNodes) {
      const nodeHeight =
        yScale(getNodeTotalFlowValue(node)) - sankeyConfig.nodePadding;

      Object.assign(node, {
        x0: x,
        x1: x + sankeyConfig.nodeWidth,
        y0: y0,
        y1: y0 + nodeHeight,
        linksEndY: y0 + yScale(getNodeVisibleFlowValue(node)),
      });

      let linkStartY0 = 0;
      const visibleSourceLinks = node.sourceLinks.filter((v) => !v.isHidden);
      for (const link of visibleSourceLinks) {
        const isLastLink = link === visibleSourceLinks.at(-1);
        const linkHeight = yScale(link.value);
        link.start = {
          x: x + sankeyConfig.nodeWidth + sankeyConfig.linkXPadding,
          y0: y0 + linkStartY0,
          y1:
            y0 +
            linkStartY0 +
            linkHeight -
            (isLastLink ? sankeyConfig.nodePadding : 0),
        };
        linkStartY0 += linkHeight;

        if (isLastLink) {
          node.linksEndY = link.start.y1;
        }
      }

      let linkEndY0 = 0;
      const visibleTargetLinks = node.targetLinks.filter((v) => !v.isHidden);
      for (const link of visibleTargetLinks) {
        const isLastLink = link === visibleTargetLinks.at(-1);
        const linkHeight = yScale(link.value);
        link.end = {
          x: x - sankeyConfig.linkXPadding,
          y0: y0 + linkEndY0,
          y1:
            y0 +
            linkEndY0 +
            linkHeight -
            (isLastLink ? sankeyConfig.nodePadding : 0),
        };
        linkEndY0 += linkHeight;
      }
      y0 += nodeHeight + sankeyConfig.nodePadding;
      rowCount += 1;
    }

    // @ts-ignore
    x += spacingBetweenColumns + column.rightPadding;
    columnIdx += 1;
  }
}

// function getNodeMaxOutgoingValue(node: NodeMeta) {
//   return Math.max(...node.sourceLinks.map((v) => v.value));
// }

function getNodeTotalFlowValue(node: SankeyNode) {
  let totalColumnSourceFlowValue = 0;
  for (const link of node.sourceLinks) {
    totalColumnSourceFlowValue += link.value;
  }

  let totalColumnTargetFlowValue = 0;
  for (const link of node.targetLinks) {
    totalColumnTargetFlowValue += link.value;
  }

  return Math.max(totalColumnSourceFlowValue, totalColumnTargetFlowValue);
}

function getNodeVisibleFlowValue(node: SankeyNode) {
  let totalColumnSourceFlowValue = 0;
  for (const link of node.sourceLinks.filter((v) => !v.isHidden)) {
    totalColumnSourceFlowValue += link.value;
  }

  let totalColumnTargetFlowValue = 0;
  for (const link of node.targetLinks.filter((v) => !v.isHidden)) {
    totalColumnTargetFlowValue += link.value;
  }

  return Math.max(totalColumnSourceFlowValue, totalColumnTargetFlowValue);
}

function getColumnTotalFlowValue(columnNodes: SankeyNode[]) {
  let totalColumnFlowValue = 0;
  for (const node of columnNodes) {
    totalColumnFlowValue += getNodeTotalFlowValue(node);
  }

  return totalColumnFlowValue;
}

// Symmetric fit
function computeSpacingBetweenColumns(
  rectangleWidth: number,
  columns: SankeyColumn[],
  sankeyConfig: SankeyConfig
) {
  const columnWidth = sankeyConfig.nodeWidth;

  const totalPadding = Object.values(columns.map((c) => c.rightPadding)).reduce(
    // @ts-ignore
    (a, b) => a + b,
    0
  );
  // @ts-ignore
  const totalColumnsWidth = columnWidth * columns.length + totalPadding; // Calculate total width needed for all columns
  const totalSpaces = columns.length + 1; // Calculate total spaces between columns and on the edges

  // Calculate spacing based on the rectangle width, total columns width, and total spaces
  return (rectangleWidth - totalColumnsWidth) / totalSpaces;
}

function markHiddenNodes(columns: SankeyColumn[]) {
  for (const column of columns) {
    let rowIdx = 0;
    for (const node of column.nodes) {
      // @ts-ignore
      if (rowIdx < column.visibleRows[0] || rowIdx >= column.visibleRows[1]) {
        node.isHidden = true;
        node.sourceLinks.forEach((l) => (l.isHidden = true));
        node.targetLinks.forEach((l) => (l.isHidden = true));
      }
      rowIdx += 1;
    }
  }
}
