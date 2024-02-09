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
  //   const COLUMN_PADDING = globalWidth / columns.length / 2;
  //   const colWidth = globalWidth / columns.length - COLUMN_PADDING;
  //   const colWidth = globalWidth / columns.length;
  const spacingBetweenColumns = computeSpacingBetweenColumns(
    globalWidth,
    sankeyConfig.nodeWidth,
    columns.length
  );
  let x = spacingBetweenColumns;
  for (const columnNodes of columns) {
    const totalColumnFlowValue = getColumnTotalFlowValue(columnNodes);
    const yScale = scaleLinear()
      .domain([0, totalColumnFlowValue])
      .range([0, globalHeight]);

    let y0 = 0;
    for (const node of columnNodes) {
      const nodeHeight = yScale(getNodeTotalFlowValue(node));
      node.x0 = x;
      node.x1 = x + sankeyConfig.nodeWidth;
      node.y0 = y0;
      node.y1 = y0 + nodeHeight;
      y0 += nodeHeight + sankeyConfig.nodePadding; // TODO: incorporate padding

      let linkStartY0 = 0;
      for (const link of node.sourceLinks) {
        const linkHeight = yScale(link.value);
        // @ts-ignore
        link.start = {
          x,
          y0: linkStartY0,
          y1: linkStartY0 + linkHeight,
        };
        linkStartY0 += linkHeight;
      }

      let linkEndY0 = 0;
      for (const link of node.targetLinks) {
        const linkHeight = yScale(link.value);
        // @ts-ignore
        link.end = {
          x,
          y0: linkEndY0,
          y1: linkEndY0 + linkHeight,
        };
        linkEndY0 += linkHeight;
      }
    }

    x += spacingBetweenColumns;
  }

  // TODO: Add support numVisibleRows, or visible extent
  // const rowHeight
}

function computeNodeColumns(nodes: NodeMeta[]): NodeMeta[][] {
  // @ts-ignore
  const numColumns = Math.max(...nodes.map((n) => n.depth + 1));
  const columns: NodeMeta[][] = Array.from({ length: numColumns }, () => []);
  for (const node of nodes) {
    // @ts-ignore
    columns[node.depth].push(node); // TODO: sort?
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

  //   if (spacing >= 0) {
  //     console.log("Columns can fit symmetrically.");
  //     console.log("Spacing between edges and columns:", spacing, "px");
  //     console.log("Spacing between columns:", spacing, "px");
  //   } else {
  //     console.log("Columns cannot fit symmetrically.");
  //   }
  //   return spacing;
}
