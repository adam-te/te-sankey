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
    sankeyConfig.nodeWidth,
    columns.length
  );

  let x = spacingBetweenColumns;
  // TODO: sort column nodes here to minimize crossings. Don't sort visible only
  for (const columnNodes of columns) {
    const visibleColumnNodes = columnNodes.slice(
      0,
      sankeyConfig.numberOfVisibleRows
    );
    for (const v of columnNodes.slice(sankeyConfig.numberOfVisibleRows)) {
      v.isHidden = true;
      v.sourceLinks.forEach((l) => (l.isHidden = true));
      v.targetLinks.forEach((l) => (l.isHidden = true));
    }
    const totalColumnFlowValue = getColumnTotalFlowValue(visibleColumnNodes);
    const yScale = scaleLinear()
      .domain([0, totalColumnFlowValue])
      .range([0, globalHeight]);

    let y0 = 0;
    let rowCount = 1;
    for (const node of visibleColumnNodes) {
      const nodeHeight = yScale(getNodeTotalFlowValue(node));
      node.x0 = x;
      node.x1 = x + sankeyConfig.nodeWidth;
      node.y0 = y0;
      node.y1 = y0 + nodeHeight;

      let linkStartY0 = 0;
      for (const link of node.sourceLinks.sort(
        // @ts-ignore
        (a, b) => a.target.rowIdx - b.target.rowIdx
      )) {
        const linkHeight = yScale(link.value);
        link.start = {
          x: x + sankeyConfig.nodeWidth,
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
          x,
          y0: y0 + linkEndY0,
          y1: y0 + linkEndY0 + linkHeight,
        };
        linkEndY0 += linkHeight;
      }
      y0 += nodeHeight + sankeyConfig.nodePadding; // TODO: incorporate padding
      rowCount += 1;
    }

    x += spacingBetweenColumns;
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
  columnWidth: number,
  numberOfColumns: number
) {
  const totalColumnsWidth = columnWidth * numberOfColumns; // Calculate total width needed for all columns
  const totalSpaces = numberOfColumns + 1; // Calculate total spaces between columns and on the edges

  // Calculate spacing based on the rectangle width, total columns width, and total spaces
  return (rectangleWidth - totalColumnsWidth) / totalSpaces;
}
