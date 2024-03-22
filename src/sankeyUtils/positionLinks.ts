import { ScaleLinear } from "d3-scale";
import { SankeyConfig, SankeyLink } from "./models";

export function positionLinks({
  x,
  y0,
  yScale,
  links,
  sankeyConfig,
  type,
}: {
  x: number;
  y0: number;
  yScale: ScaleLinear<number, number>;
  links: Pick<SankeyLink, "value" | "start" | "end">[];
  sankeyConfig: Pick<SankeyConfig, "linkXPadding" | "nodeYPadding">;
  type: "start" | "end";
}): {
  linksEndY: number | undefined;
} {
  if (!links.length) {
    return { linksEndY: undefined };
  }

  let nodePaddingRemaining = sankeyConfig.nodeYPadding;
  for (const [idx, link] of links.entries()) {
    const linksRemaining = links.length - idx;
    const nodePaddingPerLink = nodePaddingRemaining / linksRemaining; // offset node padding equally amongst links, to the extent possible (don't go negative)

    let y1 = y0 + yScale(link.value);

    const rawLinkHeight = y1 - y0;
    if (rawLinkHeight > nodePaddingPerLink) {
      y1 -= nodePaddingPerLink;
      nodePaddingRemaining -= nodePaddingPerLink;
    } else {
      const amountToRemove = rawLinkHeight - 1;
      nodePaddingRemaining -= amountToRemove;
      y1 = y0 + 1;
    }

    link[type] = {
      x: x + sankeyConfig.linkXPadding,
      y0,
      y1,
    };
    y0 = y1;
  }

  return { linksEndY: links.at(-1)?.[type]?.y1 };
}
