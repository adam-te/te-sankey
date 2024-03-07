import {
  SubnetData,
  Subnet,
  SankeyGraph,
  SankeyNode,
  SankeyLink,
  SubnetLink,
  SankeyColumn,
} from "../src/models";
// const { vertices: subnets, edges: links } = data;

export interface ComputeSankeyGroupingOptions {
  // ??
  sourceGroupType: "REGION" | "VPC" | "SUBNET";
  targetGroupType: "REGION" | "VPC" | "SUBNET";
  focusedNode?: SankeyNode;
}
interface GroupType {
  getGroupId: (subnet: Subnet) => string;
}

interface SubnetGroup {
  id: string;
  isTarget: boolean;
  subnets: Subnet[];
  sourceLinks: SubnetLink[];
}

const GroupType: Record<string, GroupType> = {
  Region: {
    getGroupId: (subnet: Subnet) => `REGION_${subnet.region}`,
  },
  Vpc: {
    getGroupId: (subnet: Subnet) => `VPC_${subnet.vpc}`,
  },
  Subnet: {
    getGroupId: (subnet: Subnet) => `SUBNET_${subnet.subnet}`,
  },
};

export function computeSankeyGrouping(
  data: SubnetData,
  options: ComputeSankeyGroupingOptions
): SankeyGraph {
  const regionGroups = computeGroupedSubnets(data, GroupType.Region);
  const vpcGroups = computeGroupedSubnets(data, GroupType.Vpc);
  const subnetGroups = computeGroupedSubnets(data, GroupType.Subnet);

  const visibility = getColumnVisibility(options);
  const groups: SubnetGroup[] = [];
  const columns = [];
  if (visibility.isSourceRegionsVisible) {
    columns.push();
    groups.push(...regionGroups.filter((v) => !v.isTarget));
  }
  if (visibility.isSourceVpcsVisible) {
    groups.push(...vpcGroups.filter((v) => !v.isTarget));
  }
  if (visibility.isSourceSubnetsVisible) {
    groups.push(...subnetGroups.filter((v) => !v.isTarget));
  }
  if (visibility.isTargetRegionsVisible) {
    groups.push(...regionGroups.filter((v) => v.isTarget));
  }
  if (visibility.isTargetVpcsVisible) {
    groups.push(...vpcGroups.filter((v) => v.isTarget));
  }
  if (visibility.isTargetSubnetsVisible) {
    groups.push(...subnetGroups.filter((v) => v.isTarget));
  }

  const groupIdToSankeyNode = new Map<string, SankeyNode>();
  const sourceColumn: SankeyColumn = { nodes: [] };
  const targetColumn: SankeyColumn = { nodes: [] };
  for (const group of groups) {
    const sankeyNode: SankeyNode = {
      id: group.id,
      sourceLinks: [],
      targetLinks: [],
    };
    groupIdToSankeyNode.set(group.id, sankeyNode);

    const column = group.isTarget ? targetColumn : sourceColumn;
    column.nodes.push(sankeyNode);
  }

  // Group -> Links
  const sankeyLinks: SankeyLink[] = [];
  for (const group of groups) {
    const groupSourceLinks = computeGroupLinks(
      groupIdToSankeyNode,
      group,
      GroupType.Region
    );

    // Add link to relevant nodes
    for (const link of groupSourceLinks) {
      link.source.sourceLinks.push(link);
      link.target.targetLinks.push(link);
    }

    sankeyLinks.push(...groupSourceLinks);
  }

  return {
    nodes: [...groupIdToSankeyNode.values()],
    links: sankeyLinks,
    // TODO: Do BFS to compute columns
    columns: [sourceColumn, targetColumn],
  };
}

// Produce one collapsed node, link per "group"
function computeGroupedSubnets(
  data: SubnetData,
  groupType: GroupType
): SubnetGroup[] {
  // const { vertices: subnetIdToSubnet, edges: subnetLinks } = data;

  const idToSubnetSourceLinks = getIdToSourceSubnetLinks(data.links);

  // const idToSubnetLinks = new Map(data.subnets.map((v) => [v.id, v]));
  const groupIdToGroup = new Map<string, SubnetGroup>();
  for (const subnet of Object.values(data.subnets)) {
    const groupId = groupType.getGroupId(subnet);
    if (!groupIdToGroup.has(groupId)) {
      groupIdToGroup.set(groupId, {
        id: groupId,
        isTarget: Boolean(idToSubnetSourceLinks.get(subnet.id)?.length),
        subnets: [],
        sourceLinks: [],
        // targetLinks: [],
      });
    }

    groupIdToGroup.get(groupId)?.subnets.push(subnet);
  }

  // will not add links to non-visible nodes... desired? (I think we may want to keep)
  for (const subnetLink of data.links) {
    const sourceGroupId = groupType.getGroupId(subnetLink.source);
    if (groupIdToGroup.has(sourceGroupId)) {
      groupIdToGroup.get(sourceGroupId)?.sourceLinks.push(subnetLink);
    }

    // @ts-ignore
    // const targetGroupId = groupType.getGroupId(subnetLink.target);
    // if (groupIdToGroup.has(targetGroupId)) {
    //   groupIdToGroup.get(targetGroupId)?.targetLinks.push(subnetLink);
    // }
  }

  return [...groupIdToGroup.values()];
}

// function isTargetSubnet(subnet: Subnet, subnetLinks: SubnetLink[]) {
//   return Boolean(subnetLinks.length && subnetLinks[0].target.id === subnet.id);
// }

function getIdToSourceSubnetLinks(
  links: SubnetLink[]
): Map<string, SubnetLink[]> {
  return new Map(
    Object.entries(
      links.reduce((a: Record<string, SubnetLink[]>, v) => {
        if (!a[v.source.id]) {
          a[v.source.id] = [];
        }
        a[v.source.id].push(v);
        return a;
      }, {})
    )
  );
}

function computeGroupLinks(
  groupIdToSankeyNode: Map<string, SankeyNode>,
  group: SubnetGroup,
  targetGroupType: GroupType
): SankeyLink[] {
  const targetGroupIdToLinks = new Map<string, SubnetLink[]>();
  for (const link of group.sourceLinks) {
    const targetGroupId = targetGroupType.getGroupId(link.target);
    if (!targetGroupIdToLinks.has(targetGroupId)) {
      targetGroupIdToLinks.set(targetGroupId, []);
    }

    targetGroupIdToLinks.get(targetGroupId)?.push(link);
  }

  return [...targetGroupIdToLinks.values()].map((links) => {
    return {
      source: groupIdToSankeyNode.get(group.id) as SankeyNode,
      target: groupIdToSankeyNode.get(
        targetGroupType.getGroupId(links[0].target)
      ) as SankeyNode,
      value: links.reduce(
        (sum: number, v: SubnetLink) => sum + v.egressBytes + v.ingressBytes,
        0
      ),
    };
  });
}

function getSubnetLinkId(
  link: SubnetLink,
  sourceGroupType: GroupType,
  targetGroupType: GroupType
) {
  return `${sourceGroupType.getGroupId(
    link.source
  )}_${targetGroupType.getGroupId(link.target)}`;
}

function getColumnVisibility(options: ComputeSankeyGroupingOptions): {
  isSourceRegionsVisible: boolean;
  isSourceVpcsVisible: boolean;
  isSourceSubnetsVisible: boolean;

  // Target defined by filter
  isTargetSubnetsVisible: boolean;
  isTargetVpcsVisible: boolean;
  isTargetRegionsVisible: boolean;
} {
  return {
    // Source defined by filter plus clicks
    isSourceRegionsVisible: ["REGION"].includes(options.sourceGroupType),
    isSourceVpcsVisible:
      ["VPC"].includes(options.sourceGroupType) ||
      (options.sourceGroupType === "REGION" && !!options.focusedNode),
    isSourceSubnetsVisible:
      ["SUBNET"].includes(options.sourceGroupType) ||
      !!options.focusedNode?.id.startsWith("VPC_"), // TODO: Fix

    // Target defined by filter
    isTargetSubnetsVisible: ["SUBNET"].includes(options.targetGroupType),
    isTargetVpcsVisible: ["SUBNET", "VPC"].includes(options.targetGroupType),
    isTargetRegionsVisible: ["SUBNET", "VPC", "REGION"].includes(
      options.targetGroupType
    ),
  };
}
