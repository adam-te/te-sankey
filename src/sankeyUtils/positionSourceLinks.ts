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
  let linkStartY0 = y0;

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
    console.log("LINK Y0", linkStartY0);
    let y1 = linkStartY0 + yScale(link.value);
    if (y1 > nodePaddingPerLink) {
      y1 -= nodePaddingPerLink;
      nodePaddingRemaining -= nodePaddingPerLink;
    } else {
      nodePaddingRemaining -= y1 - 1;
      y1 = 1;
    }

    link.start = {
      x: x + sankeyConfig.nodeWidth + sankeyConfig.linkXPadding,
      y0: linkStartY0,
      y1,
    };
    linkStartY0 = y1;
  }

  // @ts-ignore
  return { linksEndY: links.at(-1)?.start?.y1 };
}
