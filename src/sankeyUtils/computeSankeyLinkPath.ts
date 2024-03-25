import { SankeyLink } from "."

// export function computeSankeyLinkPath(
//   link: Pick<SankeyLink, "start" | "end">
// ): string {
//   if (!link.start || !link.end) {
//     throw new Error("link.start and link.end must be defined!")
//   }
//   const { start, end } = link

//   // Calculate control points for smooth curves
//   const controlPointX1 = start.x + (end.x - start.x) / 3
//   const controlPointX2 = start.x + (2 * (end.x - start.x)) / 3

//   const startTop = start.y0
//   const startBottom = start.y1
//   const endTop = end.y0
//   const endBottom = end.y1

//   // Construct the Bezier curve
//   return [
//     `M${start.x},${startTop}`, // Move to start top
//     `C${controlPointX1},${startTop} ${controlPointX2},${endTop} ${end.x},${endTop}`, // Curve to end top
//     `L${end.x},${endTop}`, // Line to end top (for clarity, technically redundant)
//     `L${end.x},${endBottom}`, // Line to end bottom
//     `C${controlPointX2},${endBottom} ${controlPointX1},${startBottom} ${start.x},${startBottom}`, // Curve to start bottom
//     "Z", // Close path
//   ].join(" ")
// }

export function computeSankeyLinkPath(link: Pick<SankeyLink, "start" | "end">): string {
  if (!link.start || !link.end) {
    throw new Error("link.start and link.end must be defined!")
  }
  const { start, end } = link

  // Calculate the width of the path
  const pathWidth = Math.abs(end.x - start.x)

  // Adjust control points to start the curve roughly in the middle of the path width
  const controlPointX1 = start.x + pathWidth / 2
  const controlPointX2 = end.x - pathWidth / 2

  const startTop = start.y0
  const startBottom = start.y1
  const endTop = end.y0
  const endBottom = end.y1

  return [
    `M${start.x},${startTop}`, // Move to start top
    `C${controlPointX1},${startTop} ${controlPointX2},${endTop} ${end.x},${endTop}`, // Curve to end top
    `L${end.x},${endTop}`, // Line to end top (for clarity, technically redundant)
    `L${end.x},${endBottom}`, // Line to end bottom
    `C${controlPointX2},${endBottom} ${controlPointX1},${startBottom} ${start.x},${startBottom}`, // Curve to start bottom
    "Z", // Close path
  ].join(" ")
}
