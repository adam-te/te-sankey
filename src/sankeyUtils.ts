import { SankeyColumn, SankeyConfig, SankeyLink, SankeyNode } from "./models";
import { ScaleLinear, scaleLinear } from "d3-scale";

export {
  positionColumn,
  positionNode,
  positionSourceLinks,
  positionTargetLinks,
  markHiddenNodes,
  computeSpacingBetweenColumns,
};

function positionColumn({
  x,
  column,
  sankeyConfig,
}: {
  x: number;
  column: SankeyColumn;
  sankeyConfig: SankeyConfig;
}) {
  const globalHeight = sankeyConfig.graphMeta.height;
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
    const { nodeHeight } = positionNode({
      x,
      y0,
      yScale,
      node,
      sankeyConfig,
    });
    y0 += nodeHeight + sankeyConfig.nodePadding;
    rowCount += 1;
  }
}

function positionNode({
  x,
  y0,
  yScale,
  node,
  sankeyConfig,
}: {
  x: number;
  y0: number;
  yScale: ScaleLinear<number, number>;
  node: SankeyNode;
  sankeyConfig: SankeyConfig;
}) {
  const nodeHeight =
    yScale(getNodeTotalFlowValue(node)) - sankeyConfig.nodePadding;

  Object.assign(node, {
    x0: x,
    x1: x + sankeyConfig.nodeWidth,
    y0: y0,
    y1: y0 + nodeHeight,
    linksEndY: y0 + yScale(getNodeVisibleFlowValue(node)),
  });

  const { linksEndY } = positionSourceLinks({
    x,
    y0,
    yScale,
    links: node.sourceLinks.filter((v) => !v.isHidden),
    sankeyConfig,
  });
  // TODO: IS this necessary? Just use derived getter instead
  node.linksEndY = linksEndY;

  positionTargetLinks({
    x,
    y0,
    yScale,
    links: node.targetLinks.filter((v) => !v.isHidden),
    sankeyConfig,
  });

  return {
    nodeHeight,
  };
}

function positionSourceLinks({
  x,
  y0,
  yScale,
  links,
  sankeyConfig,
}: {
  x: number;
  y0: number;
  yScale: ScaleLinear<number, number>;
  links: SankeyLink[];
  sankeyConfig: SankeyConfig;
}): {
  linksEndY: number;
} {
  let linkStartY0 = 0;
  let linksEndY = null;
  for (const link of links) {
    const isLastLink = link === links.at(-1);
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
      linksEndY = link.start.y1;
    }
  }

  // @ts-ignore
  return { linksEndY };
}

function positionTargetLinks({
  x,
  y0,
  yScale,
  links,
  sankeyConfig,
}: {
  x: number;
  y0: number;
  yScale: ScaleLinear<number, number>;
  links: SankeyLink[];
  sankeyConfig: SankeyConfig;
}): void {
  let linkEndY0 = 0;
  for (const link of links) {
    const isLastLink = link === links.at(-1);
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
    for (const [rowIdx, node] of column.nodes.entries()) {
      if (!column.visibleRows) {
        throw new Error("column.visibleRows must be defined at this point!");
      }
      const isRowHidden =
        rowIdx < column.visibleRows[0] || rowIdx >= column.visibleRows[1];
      if (isRowHidden) {
        node.isHidden = true;
        node.sourceLinks.forEach((l) => (l.isHidden = true));
        node.targetLinks.forEach((l) => (l.isHidden = true));
      }
    }
  }
}
