import { SankeyColumn, SankeyConfig } from "."

/**
 * Symmetric fit
 */
export function computeSpacingBetweenColumns(
  rectangleWidth: number,
  columns: SankeyColumn[],
  sankeyConfig: SankeyConfig
) {
  const columnWidth = sankeyConfig.nodeWidth

  const totalPadding = Object.values(columns.map(c => c.rightPadding)).reduce(
    (a, b) => a + b,
    0
  )
  const totalColumnsWidth = columnWidth * columns.length + totalPadding // Calculate total width needed for all columns
  const totalSpaces = columns.length + 1 // Calculate total spaces between columns and on the edges

  // Calculate spacing based on the rectangle width, total columns width, and total spaces
  return (rectangleWidth - totalColumnsWidth) / totalSpaces
}
