import { RawSubnetData, Subnet, SubnetData } from "./models"

/**
 * Replace localId/targetId string with actual object reference, hence
 * "wiring" the graph.
 *
 * Also create a distinct SOURCE and TARGET set of nodes to handle cycles
 * e.g. some traffic in 'us-west-1' may stay within 'us-west-1', which
 * presents as a cycle/self-link. Instead, we visualize this as a traffic flow
 * from the source 'us-west-1' to the target 'us-west-1'
 */
export function computeWiredGraph(data: RawSubnetData): SubnetData {
  const { vertices, edges: links } = data

  const subnets = [...Object.values(vertices)].flatMap(v => {
    let prefix = "SOURCE_"
    if (v.isTarget) {
      prefix = "TARGET_"
    }
    return [
      {
        id: `${prefix}${v.id}`,
        account: `${prefix}${v.account}`,
        region: `${prefix}${v.region}`,
        vpc: `${prefix}${v.vpc}`,
        az: `${prefix}${v.az}`,
        subnet: `${prefix}${v.subnet}`,
        isTarget: v.isTarget,
        name: v.name,
        vpcName: v.vpcName,
        vpcId: v.vpc,
        regionId : v.region
      },
    ]
  })
  const subnetIdToSubnet = new Map<string, Subnet>(subnets.map(v => [v.id, v]))
  return {
    subnets,
    // NOTE: This inserts links that will later need to be culled e.g. SOURCE_REGION -> SOURCE_REGION
    // It simply inserts all conceptually valid link configurations
    // TODO: Cull it here to avoid unnecessary processing
    links: links.flatMap(v => {
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
      ]
    }),
  }
}
