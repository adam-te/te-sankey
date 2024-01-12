import { linkHorizontal } from "d3-shape";

function horizontalSource(d: any): [number, number] {
  // @ts-ignore
  return [d.source.x1, d.y0];
}

function horizontalTarget(d: any): [number, number] {
  // @ts-ignore
  return [d.target.x0, d.y1];
}

/**
 * Get a horizontal link shape suitable for a Sankey diagram.
 * Source and target accessors are pre-configured and work with the
 * default x- and y- accessors of the link shape generator.
 *
 * The first generic N refers to user-defined properties contained in the node data passed into
 * Sankey layout generator. These properties are IN EXCESS to the properties explicitly identified in the
 * SankeyNodeMinimal interface.
 *
 * The second generic L refers to user-defined properties contained in the link data passed into
 * Sankey layout generator. These properties are IN EXCESS to the properties explicitly identified in the
 * SankeyLinkMinimal interface.
 */
export function sankeyLinkHorizontal() {
  return linkHorizontal().source(horizontalSource).target(horizontalTarget);
}
