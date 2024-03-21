import { expect, describe, it } from "vitest";
import { positionTargetLinks } from "./positionTargetLinks";
import { scaleLinear } from "d3-scale";

describe("positionTargetLinks", () => {
  it("should work with simple zeroed out config", () => {
    const testParams = getDefaultTestParams();
    positionTargetLinks(testParams);
    const { links } = testParams;

    expect(links[0].end).toEqual({
      x: 0,
      y0: 0,
      y1: 10,
    });
    expect(links[1].end).toEqual({
      x: 0,
      y0: 10,
      y1: 110,
    });
  });

  it("should add horizontal padding as specified", () => {
    const testParams = getDefaultTestParams();
    testParams.sankeyConfig.linkXPadding = 10;
    positionTargetLinks(testParams);
    const { links } = testParams;

    expect(links[0].end).toEqual({
      x: -10,
      y0: 0,
      y1: 10,
    });
    expect(links[1].end).toEqual({
      x: -10,
      y0: 10,
      y1: 110,
    });
  });

  it("should distribute offset from node y padding equally among links", () => {
    const testParams = getDefaultTestParams();
    testParams.sankeyConfig.nodeYPadding = 10;
    positionTargetLinks(testParams);
    const { links } = testParams;

    expect(links[0].end).toEqual({
      x: 0,
      y0: 0,
      y1: 5,
    });
    expect(links[1].end).toEqual({
      x: 0,
      y0: 5,
      y1: 100,
    });
  });

  it("should consume all nodeYPadding, even if later links are smaller than paddingPerLink", () => {
    const testParams = getDefaultTestParams();
    testParams.sankeyConfig.nodeYPadding = 10;
    testParams.links = [
      {
        value: 100,
        end: undefined,
      },
      {
        value: 1,
        end: undefined,
      },
    ];
    positionTargetLinks(testParams);
    const { links } = testParams;

    expect(links[0].end).toEqual({
      x: 0,
      y0: 0,
      y1: 1,
    });
    expect(links[1].end).toEqual({
      x: 0,
      y0: 1,
      y1: 96,
    });
  });
});

function getDefaultTestParams() {
  const links = [
    {
      value: 10,
      end: undefined,
    },
    {
      value: 100,
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
    yScale: scaleLinear(),
  };
}
