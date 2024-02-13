import { SankeyConfig, NodeMeta } from "./models";
import { scaleLinear } from "d3-scale";

export function setStartAndEnd(nodes: NodeMeta[], sankeyConfig: SankeyConfig) {
  // start: { x, y0, y1 } // link left
  // end: { x, y0, y1 } // link right
  const { extent } = sankeyConfig;

  const [[x0, y0], [x1, y1]] = extent;
  const globalWidth = x1 - x0;
  const globalHeight = y1 - y0;

  const columns = computeNodeColumns(nodes);
  const spacingBetweenColumns = computeSpacingBetweenColumns(
    globalWidth,
    columns.length,
    sankeyConfig
  );

  // TODO: Move back to loop
  markVisibleNodes(columns, sankeyConfig);

  let x = spacingBetweenColumns;
  let columnIdx = 0;
  // TODO: sort column nodes here to minimize crossings. Don't sort visible only
  for (const columnNodes of columns) {
    const visibleColumnNodes = columnNodes.slice(
      0,
      sankeyConfig.numberOfVisibleRows
    );

    const totalColumnFlowValue = getColumnTotalFlowValue(visibleColumnNodes);
    const yScale = scaleLinear()
      .domain([0, totalColumnFlowValue])
      .range([0, globalHeight]);

    let y0 = 0;
    let rowCount = 1;
    for (const node of visibleColumnNodes) {
      // TODO: nodeHeight must be based on both visible and non-visible nodes
      // "Active" is visible, inactive is invisible
      const nodeHeight = yScale(getNodeTotalFlowValue(node));

      node.x0 = x;
      node.x1 = x + sankeyConfig.nodeWidth;
      node.y0 = y0;
      // @ts-ignore
      node.linksEndY = y0 + yScale(getNodeVisibleFlowValue(node));
      node.y1 = y0 + nodeHeight;

      let linkStartY0 = 0;
      for (const link of node.sourceLinks.sort(
        // @ts-ignore
        (a, b) => a.target.rowIdx - b.target.rowIdx
      )) {
        const linkHeight = yScale(link.value);
        link.start = {
          x: x + sankeyConfig.nodeWidth + sankeyConfig.linkXPadding,
          y0: y0 + linkStartY0,
          y1: y0 + linkStartY0 + linkHeight,
        };
        linkStartY0 += linkHeight;
      }

      let linkEndY0 = 0;
      for (const link of node.targetLinks.sort(
        // @ts-ignore
        (a, b) => a.source.rowIdx - b.source.rowIdx
      )) {
        const linkHeight = yScale(link.value);
        link.end = {
          x: x - sankeyConfig.linkXPadding,
          y0: y0 + linkEndY0,
          y1: y0 + linkEndY0 + linkHeight,
        };
        linkEndY0 += linkHeight;
      }
      y0 += nodeHeight + sankeyConfig.nodePadding; // TODO: incorporate padding
      rowCount += 1;
    }

    // TODO: Add support for merging links
    // for each neighboring link on left that goes to contiguous block (must be max flow), join with neighbor
    // DONT DO THIS, due to mis-representing flows

    console.log(sankeyConfig.columnIdxToPadding);
    x +=
      spacingBetweenColumns + (sankeyConfig.columnIdxToPadding[columnIdx] || 0);
    // x += spacingBetweenColumns;
    columnIdx += 1;
  }
}

function computeNodeColumns(nodes: NodeMeta[]): NodeMeta[][] {
  // @ts-ignore
  const numColumns = Math.max(...nodes.map((n) => n.depth + 1));

  const columns: NodeMeta[][] = Array.from({ length: numColumns }, () => []);
  for (const node of nodes) {
    // @ts-ignore
    const rowIdx = columns[node.depth].length;
    // @ts-ignore
    columns[node.depth].push(node); // TODO: sort?
    // @ts-ignore
    node.columnIdx = node.depth;
    // @ts-ignore
    node.rowIdx = rowIdx;
  }
  return columns;
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
  numberOfColumns: number,
  sankeyConfig: SankeyConfig
) {
  const columnWidth = sankeyConfig.nodeWidth;
  const totalPadding = Object.values(sankeyConfig.columnIdxToPadding).reduce(
    (a, b) => a + b,
    0
  );
  const totalColumnsWidth = columnWidth * numberOfColumns + totalPadding; // Calculate total width needed for all columns
  const totalSpaces = numberOfColumns + 1; // Calculate total spaces between columns and on the edges

  // Calculate spacing based on the rectangle width, total columns width, and total spaces
  return (rectangleWidth - totalColumnsWidth) / totalSpaces;
}

function markVisibleNodes(columns: NodeMeta[][], sankeyConfig: SankeyConfig) {
  for (const columnNodes of columns) {
    let row = 1;
    for (const node of columnNodes) {
      if (row > sankeyConfig.numberOfVisibleRows) {
        node.isHidden = true;
        node.sourceLinks.forEach((l) => (l.isHidden = true));
        node.targetLinks.forEach((l) => (l.isHidden = true));
      }
      row += 1;
    }
  }
}
