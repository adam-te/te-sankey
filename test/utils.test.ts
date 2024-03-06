import { expect, test, describe } from "vitest";
import { computeSankeyGrouping } from "../src/utils";
import { Subnet, SubnetData } from "../src/models";

test("Given two raw Subnets, show 2 columns, region -> region", () => {
  const subnets = [
    {
      id: "subnet_1",
      region: "us-east-1",
    } as Subnet,
    {
      id: "subnet_2",
      region: "us-west-1",
    } as Subnet,
  ];
  const mockData: SubnetData = {
    subnets,
    links: [
      {
        source: subnets[0],
        target: subnets[1],
        egressBytes: 10,
        ingressBytes: 100,
      },
    ],
  };
  const result = computeSankeyGrouping(mockData, {
    sourceGroupType: "REGION",
    targetGroupType: "REGION",
  });

  expect(result.nodes.length).toBe(2);
  expect(result.nodes[0]).toMatchObject({ id: "subnet_1" });
  expect(result.nodes[1]).toMatchObject({ id: "subnet_2" });

  expect(result.links.length).toBe(1);
  expect(result.links[0]).toMatchObject({
    source: { id: "subnet_1" },
    target: { id: "subnet_2" },
    value: 110, // TODO: Fix, not just added together
  });

  expect(result.columns.length).toBe(2);
  // expect(result.columns[0].nodes)
});
