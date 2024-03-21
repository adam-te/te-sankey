import { expect, describe, it } from "vitest";
import { positionLinks } from "./positionLinks";
import { scaleLinear } from "d3-scale";

describe("positionLinks", () => {
  it("should work with simple zeroed out config", () => {
    const testParams = getDefaultTestParams();
    const { linksEndY } = positionLinks(testParams);
    const { links } = testParams;

    expect(links[0].start).toEqual({
      x: 0,
      y0: 0,
      y1: 10,
    });
    expect(links[1].start).toEqual({
      x: 0,
      y0: 10,
      y1: 110,
    });
    expect(linksEndY).toBe(110);
  });

  it("should offset by supplied y0", () => {
    const testParams = getDefaultTestParams();
    testParams.y0 = 10;
    const { linksEndY } = positionLinks(testParams);
    const { links } = testParams;

    expect(links[0].start).toEqual({
      x: 0,
      y0: 10,
      y1: 20,
    });
    expect(links[1].start).toEqual({
      x: 0,
      y0: 20,
      y1: 120,
    });
    expect(linksEndY).toBe(120);
  });

  it("should add horizontal padding as specified", () => {
    const testParams = getDefaultTestParams();
    testParams.sankeyConfig.linkXPadding = 10;
    const { linksEndY } = positionLinks(testParams);
    const { links } = testParams;

    expect(links[0].start).toEqual({
      x: 10,
      y0: 0,
      y1: 10,
    });
    expect(links[1].start).toEqual({
      x: 10,
      y0: 10,
      y1: 110,
    });
    expect(linksEndY).toBe(110);
  });

  it("should distribute offset from node y padding equally among links", () => {
    const testParams = getDefaultTestParams();
    testParams.sankeyConfig.nodeYPadding = 10;
    const { linksEndY } = positionLinks(testParams);
    const { links } = testParams;

    expect(links[0].start).toEqual({
      x: 0,
      y0: 0,
      y1: 5,
    });
    expect(links[1].start).toEqual({
      x: 0,
      y0: 5,
      y1: 100,
    });
    expect(linksEndY).toBe(100);
  });
});

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
  ];
  return {
    x: 0,
    y0: 0,
    links,
    sankeyConfig: {
      linkXPadding: 0,
      nodeYPadding: 0,
    },
    type: "start" as "start" | "end",
    yScale: scaleLinear(),
  };
}
