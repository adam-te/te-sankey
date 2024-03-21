import { ScaleLinear } from "d3-scale";
import { SankeyConfig, SankeyLink } from "../models";

export function positionSourceLinks({
  x,
  y0,
  yScale,
  links,
  sankeyConfig,
}: {
  x: number;
  y0: number;
  yScale: ScaleLinear<number, number>;
  links: Pick<SankeyLink, "value" | "start">[];
  sankeyConfig: Pick<
    SankeyConfig,
    "nodeWidth" | "linkXPadding" | "nodeYPadding"
  >;
}): {
  linksEndY: number;
} {
  let linkStartY0 = 0;
  let linksEndY = null;

  // Sort smallest links first:
  // 1) For to make flows more obvious
  // 2) To allow for padding reduction to work with single pass
  // Note: May want to revisit this design decision
  //   links.sort((a, b) => a.value - b.value);

  // offset node padding equally amongst links, to the extent possible (don't go negative)
  let nodePaddingRemaining = sankeyConfig.nodeYPadding;
  const nodePaddingPerLink = sankeyConfig.nodeYPadding / links.length;

  //   console.log(nodePaddingRemaining, nodePaddingPerLink);
  for (const link of links) {
    const isLastLink = link === links.at(-1);
    const linkHeight = yScale(link.value);

    let y1 = y0 + linkStartY0 + linkHeight;
    if (y1 > nodePaddingPerLink) {
      y1 -= nodePaddingPerLink;
      nodePaddingRemaining -= nodePaddingPerLink;
    } else {
      nodePaddingRemaining -= y1 - 1;
      y1 = 1;
    }

    link.start = {
      x: x + sankeyConfig.nodeWidth + sankeyConfig.linkXPadding,
      y0: y0 + linkStartY0,
      y1,
    };
    linkStartY0 += y1;

    if (isLastLink) {
      linksEndY = link.start.y1;
    }
  }

  // @ts-ignore
  return { linksEndY };
}
