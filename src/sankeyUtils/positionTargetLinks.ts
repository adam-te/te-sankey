import { ScaleLinear } from "d3-scale";
import { SankeyConfig, SankeyLink } from "../models";

export function positionTargetLinks({
  x,
  y0,
  yScale,
  links,
  sankeyConfig,
}: {
  x: number;
  y0: number;
  yScale: ScaleLinear<number, number>;
  links: Pick<SankeyLink, "value" | "end">[];
  sankeyConfig: Pick<SankeyConfig, "linkXPadding" | "nodeYPadding">;
}): void {
  let linkEndY0 = 0;

  // Sort smallest links first:
  // 1) For to make flows more obvious
  // 2) To allow for padding reduction to work with single pass
  // Note: May want to revisit this design decision
  // ADAMTODO: this should affect crossings. Revisit algorithm for this
  //   links.sort((a, b) => a.value - b.value);

  // offset node padding equally amongst links, to the extent possible (don't go negative)
  let nodePaddingRemaining = sankeyConfig.nodeYPadding;
  const nodePaddingPerLink = sankeyConfig.nodeYPadding / links.length;

  for (const link of links) {
    const linkHeight = yScale(link.value);

    let y1 = y0 + linkEndY0 + linkHeight;
    if (y1 > nodePaddingPerLink) {
      y1 -= nodePaddingPerLink;
      nodePaddingRemaining -= nodePaddingPerLink;
    } else {
      nodePaddingRemaining -= y1 - 1;
      y1 = 1;
    }

    link.end = {
      x: x - sankeyConfig.linkXPadding,
      y0: y0 + linkEndY0,
      y1,
    };
    linkEndY0 += y1;
  }
}
