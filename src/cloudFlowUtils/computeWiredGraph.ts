import { RawSubnetData, Subnet, SubnetData } from "./models";

/**
 * Create a distinct SOURCE and TARGET set of nodes to handle cycles
 * e.g. some traffic in 'us-west-1' may stay within 'us-west-1', which
 * presents as a cycle/self-link. Instead, we visualize this as a traffic flow
 * from the source 'us-west-1' to the target 'us-west-1'
 */
export function computeWiredGraph(data: RawSubnetData): SubnetData {
  const { vertices, edges: links } = data;

  const subnets = [...Object.values(vertices)].flatMap((v) => [
    {
      id: `SOURCE_${v.id}`,
      account: `SOURCE_${v.account}`,
      region: `SOURCE_${v.region}`,
      vpc: `SOURCE_${v.vpc}`,
      az: `SOURCE_${v.az}`,
      subnet: `SOURCE_${v.subnet}`,
      isTarget: false,
    },
    {
      id: `TARGET_${v.id}`,
      account: `TARGET_${v.account}`,
      region: `TARGET_${v.region}`,
      vpc: `TARGET_${v.vpc}`,
      az: `TARGET_${v.az}`,
      subnet: `TARGET_${v.subnet}`,
      isTarget: true,
    },
  ]);
  const subnetIdToSubnet = new Map<string, Subnet>(
    subnets.map((v) => [v.id, v])
  );
  return {
    subnets,
    // NOTE: This inserts links that will later need to be culled e.g. SOURCE_REGION -> SOURCE_REGION
    // It simply inserts all conceptually valid link configurations
    // TODO: Cull it here to avoid unnecessary processing
    links: links.flatMap((v) => {
      return [
        // e.g. SOURCE_REGION -> SOURCE_VPC
        {
          source: subnetIdToSubnet.get(`SOURCE_${v.localId}`) as Subnet,
          target: subnetIdToSubnet.get(`SOURCE_${v.remoteId}`) as Subnet,
          egressBytes: v.egressBytes,
          ingressBytes: v.ingressBytes,
        },
        // e.g. SOURCE_SUBNET -> TARGET_SUBNET
        {
          source: subnetIdToSubnet.get(`SOURCE_${v.localId}`) as Subnet,
          target: subnetIdToSubnet.get(`TARGET_${v.remoteId}`) as Subnet,
          egressBytes: v.egressBytes,
          ingressBytes: v.ingressBytes,
        },
        // e.g. TARGET_SUBNET -> TARGET_VPC
        {
          source: subnetIdToSubnet.get(`TARGET_${v.localId}`) as Subnet,
          target: subnetIdToSubnet.get(`TARGET_${v.remoteId}`) as Subnet,
          egressBytes: v.egressBytes,
          ingressBytes: v.ingressBytes,
        },
      ];
    }),
  };
}
