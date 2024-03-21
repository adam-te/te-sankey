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
  let nodePaddingRemaining = sankeyConfig.nodeYPadding;
  for (const [idx, link] of links.entries()) {
    const linksRemaining = links.length - idx;
    const nodePaddingPerLink = nodePaddingRemaining / linksRemaining; // offset node padding equally amongst links, to the extent possible (don't go negative)

    let y1 = y0 + yScale(link.value);
    if (y1 > nodePaddingPerLink) {
      y1 -= nodePaddingPerLink;
      nodePaddingRemaining -= nodePaddingPerLink;
    } else {
      nodePaddingRemaining -= y1 - 1;
      y1 = 1;
    }

    link.end = {
      x: x - sankeyConfig.linkXPadding,
      y0,
      y1,
    };
    y0 = y1;
  }
}
