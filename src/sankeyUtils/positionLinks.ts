import { ScaleLinear, scaleLinear } from "d3-scale"
import { SankeyConfig, SankeyLink } from "./models"

export function positionLinks({
  x,
  y0,
  linkHeightScale,
  links,
  sankeyConfig,
  type,
}: {
  x: number
  y0: number
  linkHeightScale: ScaleLinear<number, number>
  links: Pick<SankeyLink, "value" | "start" | "end">[]
  sankeyConfig: Pick<SankeyConfig, "linkXPadding">
  type: "start" | "end"
}): {
  linksEndY: number | undefined
} {
  if (!links.length) {
    return { linksEndY: undefined }
  }
  for (const link of links) {
    let y1 = y0 + linkHeightScale(link.value)

    link[type] = {
      x: x + sankeyConfig.linkXPadding,
      y0,
      y1,
    }
    y0 = y1
  }

  return { linksEndY: links.at(-1)?.[type]?.y1 }
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest
  it("should work with simple zeroed out config", () => {
    const testParams = getDefaultTestParams()
    const { linksEndY } = positionLinks(testParams)
    const { links } = testParams

    expect(links[0].start).toEqual({
      x: 0,
      y0: 0,
      y1: 10,
    })
    expect(links[1].start).toEqual({
      x: 0,
      y0: 10,
      y1: 110,
    })
    expect(linksEndY).toBe(110)
  })

  it("should offset by supplied y0", () => {
    const testParams = getDefaultTestParams()
    testParams.y0 = 10
    const { linksEndY } = positionLinks(testParams)
    const { links } = testParams

    expect(links[0].start).toEqual({
      x: 0,
      y0: 10,
      y1: 20,
    })
    expect(links[1].start).toEqual({
      x: 0,
      y0: 20,
      y1: 120,
    })
    expect(linksEndY).toBe(120)
  })

  it("should add horizontal padding as specified", () => {
    const testParams = getDefaultTestParams()
    testParams.sankeyConfig.linkXPadding = 10
    const { linksEndY } = positionLinks(testParams)
    const { links } = testParams

    expect(links[0].start).toEqual({
      x: 10,
      y0: 0,
      y1: 10,
    })
    expect(links[1].start).toEqual({
      x: 10,
      y0: 10,
      y1: 110,
    })
    expect(linksEndY).toBe(110)
  })

  // TODO: Position node
  // it("should distribute offset from node y padding equally among links", () => {
  //   const testParams = getDefaultTestParams();
  //   testParams.sankeyConfig.nodeYPadding = 10;
  //   const { linksEndY } = positionLinks(testParams);
  //   const { links } = testParams;

  //   expect(links[0].start).toEqual({
  //     x: 0,
  //     y0: 0,
  //     y1: 5,
  //   });
  //   expect(links[1].start).toEqual({
  //     x: 0,
  //     y0: 5,
  //     y1: 100,
  //   });
  //   expect(linksEndY).toBe(100);
  // });

  function getDefaultTestParams() {
    const links = [
      {
        value: 10,
        start: undefined,
        end: undefined,
      },
      {
        value: 100,
        start: undefined,
        end: undefined,
      },
    ]
    return {
      x: 0,
      y0: 0,
      links,
      sankeyConfig: {
        linkXPadding: 0,
      },
      type: "start" as "start" | "end",
      linkHeightScale: scaleLinear(),
    }
  }
}
