import { SankeyConfig, NodeMeta, MetaGraph, MetaColumn } from "./models";
import { scaleLinear } from "d3-scale";

export function setStartAndEnd(graph: MetaGraph, sankeyConfig: SankeyConfig) {
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
  // TODO: sort column nodes here to minimize crossings. Don't sort visible only
  for (const column of graph.columns) {
    const visibleColumnNodes = column.nodes.slice(
      column.visibleRows[0],
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
      for (const link of node.sourceLinks.sort(
        // @ts-ignore
        (a, b) => a.target.rowIdx - b.target.rowIdx
      )) {
        const isLastLink = link === node.sourceLinks.at(-1);
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
      }

      let linkEndY0 = 0;
      for (const link of node.targetLinks.sort(
        // @ts-ignore
        (a, b) => a.source.rowIdx - b.source.rowIdx
      )) {
        const isLastLink = link === node.targetLinks.at(-1);
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

    x += spacingBetweenColumns + column.rightPadding;
    columnIdx += 1;
  }
}

// function getNodeMaxOutgoingValue(node: NodeMeta) {
//   return Math.max(...node.sourceLinks.map((v) => v.value));
// }

function getNodeTotalFlowValue(node: NodeMeta) {
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

function getNodeVisibleFlowValue(node: NodeMeta) {
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

function getColumnTotalFlowValue(columnNodes: NodeMeta[]) {
  let totalColumnFlowValue = 0;
  for (const node of columnNodes) {
    totalColumnFlowValue += getNodeTotalFlowValue(node);
  }

  return totalColumnFlowValue;
}

// Symmetric fit
function computeSpacingBetweenColumns(
  rectangleWidth: number,
  columns: MetaColumn[],
  sankeyConfig: SankeyConfig
) {
  const columnWidth = sankeyConfig.nodeWidth;
  const totalPadding = Object.values(columns.map((c) => c.rightPadding)).reduce(
    (a, b) => a + b,
    0
  );
  const totalColumnsWidth = columnWidth * columns.length + totalPadding; // Calculate total width needed for all columns
  const totalSpaces = columns.length + 1; // Calculate total spaces between columns and on the edges

  // Calculate spacing based on the rectangle width, total columns width, and total spaces
  return (rectangleWidth - totalColumnsWidth) / totalSpaces;
}

function markHiddenNodes(columns: MetaColumn[]) {
  for (const column of columns) {
    let rowIdx = 0;
    for (const node of column.nodes) {
      console.log(column.visibleRows);
      if (rowIdx < column.visibleRows[0] || rowIdx >= column.visibleRows[1]) {
        node.isHidden = true;
        node.sourceLinks.forEach((l) => (l.isHidden = true));
        node.targetLinks.forEach((l) => (l.isHidden = true));
      }
      rowIdx += 1;
    }
  }
}
