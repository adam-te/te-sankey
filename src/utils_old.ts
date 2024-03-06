// import {
//   SubnetData,
//   Subnet,
//   SankeyGraph,
//   SankeyNode,
//   SankeyLink,
//   SubnetLink,
// } from "../src/models";
// // const { vertices: subnets, edges: links } = data;

// export interface ComputeSankeyGroupingOptions {
//   // ??
//   sourceGroupType: "REGION" | "VPC";
//   targetGroupType: "REGION" | "VPC";
// }
// interface GroupType {
//   getGroupId: (subnet: Subnet) => string;
//   computeSankeyGroupNode: (subnetGroup: SubnetGroup) => SankeyNode;
// }

// interface SubnetGroup {
//   id: string;
//   subnets: Subnet[];
//   sourceLinks: SubnetLink[];
//   targetLinks: SubnetLink[];
// }

// interface SankeyGroup {
//   node: SankeyNode;
//   links: SankeyLink[];
// }

// const GroupType: Record<string, GroupType> = {
//   Region: {
//     getGroupId: (subnet: Subnet) => subnet.region,
//     computeSankeyGroupNode: (subnetGroup: SubnetGroup) => {
//       return {
//         id: subnetGroup.id,
//         sourceLinks: subnetGroup.sourceLinks.map((v) => {
//           return {};
//         }),
//       };
//     },
//     // computeGroupNode: (subnets: Subnet[]) => {
//     //   const [subnet] = subnets;
//     //   return {
//     //     id: subnet.region,

//     //     // TODO: links
//     //     sourceLinks: [],
//     //     targetLinks: [],
//     //   };
//     // },
//     // computeGroupLinks: (subnetLinks: SubnetLink[]) => [],
//   },
//   Vpc: {
//     getGroupId: (subnet: Subnet) => subnet.vpc,
//     computeGroupNode: (subnets: Subnet[]) => {
//       const [subnet] = subnets;
//       return {
//         id: subnet.id,
//         // TODO:
//         sourceLinks: [],
//         targetLinks: [],
//       };
//     },
//     computeGroupLinks: (subnetLinks: SubnetLink[]) => [],
//   },
//   Subnet: {
//     getGroupId: (subnet: Subnet) => subnet.id,
//     computeGroupNode: (subnets: Subnet[]) => {
//       if (subnets.length > 1) {
//         throw new Error("Subnet should never have more than one member!");
//       }
//       const [subnet] = subnets;
//       return {
//         id: subnet.id,
//         // TODO:
//         sourceLinks: [],
//         targetLinks: [],
//       };
//     },
//     computeGroupLinks: (subnetLinks: SubnetLink[]) => [],
//   },
// };

// // TODO: Return all group types
// // region, vpc, subnet
// // links can go cross group type
// // region -> vpc -> subnet -> region/vpc/subnet
// //
// // links must be merged if to broader group
// // { groups, links }
// export function computeSankeyGrouping(
//   data: SubnetData,
//   options: ComputeSankeyGroupingOptions
// ): SankeyGraph {
//   // const { sourceGroupType, targetGroupType } = options;

//   // const vpcGroups = computeGroupedNodes(data, GroupType.Vpc);
//   const regionGroups = computeGroupedNodes(data, GroupType.Region);
//   // Convert each group into SankeyNode
//   const idToSubnet = new Map<string, Subnet>(
//     Object.values(data.vertices).map((v) => [v.subnet, v])
//   );
//   const idToSankeyNode = new Map<string, SankeyNode>();
//   for (const group of regionGroups) {
//     idToSankeyNode.set(group.id, {
//       id: group.id,
//       sourceLinks: [],
//       targetLinks: [],
//     });
//   }

//   for (const group of regionGroups) {
//     const sankeyNode = idToSankeyNode.get(group.id);
//     group.sourceLinks[0];
//     sankeyNode?.sourceLinks.push();
//     sankeyNode?.targetLinks.push();
//   }

//   const;

//   // const subnetGroups = computeGroupedNodes(data, GroupType.Subnet);

//   const node = {} as SankeyNode;
//   const link = {} as SankeyLink;
//   const graph: SankeyGraph = {} as SankeyGraph;

//   return graph;
// }

// // Produce one collapsed node, link per "group"
// function computeGroupedNodes(
//   data: SubnetData,
//   groupType: GroupType
// ): SubnetGroup[] {
//   // const { vertices: subnetIdToSubnet, edges: subnetLinks } = data;

//   const groupIdToGroup = new Map<string, SubnetGroup>();
//   for (const subnet of Object.values(data.vertices)) {
//     const groupId = groupType.getGroupId(subnet);
//     if (!groupIdToGroup.has(groupId)) {
//       groupIdToGroup.set(groupId, {
//         id: groupId,
//         subnets: [],
//         sourceLinks: [],
//         targetLinks: [],
//       });
//     }

//     groupIdToGroup.get(groupId)?.subnets.push(subnet);
//   }

//   // will not add links to non-visible nodes... desired? (I think we may want to keep)
//   for (const subnetLink of data.edges) {
//     const sourceGroupId = groupType.getGroupId(
//       data.vertices[subnetLink.localId]
//     );
//     if (groupIdToGroup.has(sourceGroupId)) {
//       groupIdToGroup.get(sourceGroupId)?.sourceLinks.push(subnetLink);
//     }

//     const targetGroupId = groupType.getGroupId(
//       data.vertices[subnetLink.remoteId]
//     );
//     if (groupIdToGroup.has(targetGroupId)) {
//       groupIdToGroup.get(targetGroupId)?.targetLinks.push(subnetLink);
//     }
//   }

//   return [...groupIdToGroup.values()];
// }
