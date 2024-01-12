import { min } from "d3-array";
import { SankeyNode } from ".";

function targetDepth(d: any) {
  return d.target.depth;
}

/**
 * Compute the horizontal node position of a node in a Sankey layout with left alignment.
 * Returns (node.depth) to indicate the desired horizontal position of the node in the generated Sankey diagram.
 *
 * @param node Sankey node for which to calculate the horizontal node position.
 * @param n Total depth n of the graph  (one plus the maximum node.depth)
 */
export function left(node: SankeyNode<{}, {}>, _: number): number {
  // @ts-ignore
  return node.depth;
}

/**
 * Compute the horizontal node position of a node in a Sankey layout with right alignment.
 * Returns (n - 1 - node.height) to indicate the desired horizontal position of the node in the generated Sankey diagram.
 *
 * @param node Sankey node for which to calculate the horizontal node position.
 * @param n Total depth n of the graph  (one plus the maximum node.depth)
 */
export function right(node: SankeyNode<{}, {}>, n: number): number {
  // @ts-ignore
  return n - 1 - node.height;
}

/**
 * Compute the horizontal node position of a node in a Sankey layout with justified alignment.
 * Like d3.sankeyLeft, except that nodes without any outgoing links are moved to the far right.
 * Returns an integer between 0 and n - 1 that indicates the desired horizontal position of the node in the generated Sankey diagram.
 *
 * @param node Sankey node for which to calculate the horizontal node position.
 * @param n Total depth n of the graph  (one plus the maximum node.depth)
 */
export function justify(node: SankeyNode<{}, {}>, n: number): number {
  // @ts-ignore
  return node.sourceLinks.length ? node.depth : n - 1;
}

/**
 * Compute the horizontal node position of a node in a Sankey layout with center alignment.
 * Like d3.sankeyLeft, except that nodes without any incoming links are moved as right as possible.
 * Returns an integer between 0 and n - 1 that indicates the desired horizontal position of the node in the generated Sankey diagram.
 *
 * @param node Sankey node for which to calculate the horizontal node position.
 * @param n Total depth n of the graph  (one plus the maximum node.depth)
 */
export function center(node: SankeyNode<{}, {}>, _: number): number {
  // @ts-ignore
  return node.targetLinks.length
    ? node.depth
    : // @ts-ignore
    node.sourceLinks.length
    ? // @ts-ignore
      min(node.sourceLinks, targetDepth) - 1
    : 0;
}
