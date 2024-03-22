import { SankeyColumn, SankeyNode } from "../sankeyUtils/models";

/**
 * Sorts all columns iteratively based on the neighboring column indices to minimize
 * "link crossings" between columns. This uses a standard "sort by barycentric center"
 * approach.
 */
export function sortToMinimizeLinkCrossings({
  columns,
  numberOfIterations,
}: {
  columns: SankeyColumn[];
  numberOfIterations: number;
}): void {
  for (let i = 0; i < numberOfIterations; i++) {
    for (let j = 0; j < columns.length - 1; j++) {
      const column = columns[j];
      const nextColumn = columns[j + 1];
      sortNodesByBarycenter(column, nextColumn);
    }
  }

  function sortNodesByBarycenter(
    column: SankeyColumn,
    nextColumn: SankeyColumn
  ) {
    const nodeIdToNextColumnIdx = new Map(
      nextColumn.nodes.map((node, index) => [node.id, index])
    );
    return column.nodes.sort((a, b) => {
      const aBarycenter = calculateBarycenter(a) || Infinity;
      const bBarycenter = calculateBarycenter(b) || Infinity;
      return aBarycenter - bBarycenter;
    });

    function calculateBarycenter(node: SankeyNode) {
      const linkMidpoints = node.sourceLinks.map((v) => {
        const isLinkTargetInNextColumn = nodeIdToNextColumnIdx.has(v.target.id);
        if (!isLinkTargetInNextColumn) {
          throw new Error(
            "Link is pointing to a node that is not in the neighboring column!"
          );
        }
        return nodeIdToNextColumnIdx.get(v.target.id) as number;
      });

      return linkMidpoints.length
        ? linkMidpoints.reduce((a, b) => a + b, 0) / linkMidpoints.length
        : null;
    }
  }
}
