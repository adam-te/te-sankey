import {
  SubnetData,
  Subnet,
  SankeyGraph,
  SankeyNode,
  SankeyLink,
  SubnetLink,
  SankeyColumn,
  RawSubnetData,
  RawSubnetLink,
} from "../src/models";
// const { vertices: subnets, edges: links } = data;

export interface ComputeSankeyGroupingOptions {
  sourceGroupType: "REGION" | "VPC" | "SUBNET";
  targetGroupType: "REGION" | "VPC" | "SUBNET";
  focusedNode?: SankeyNode;
}
interface GroupType {
  id: string;
  getGroupId: (subnet: Subnet) => string;
}

interface SubnetGroup {
  id: string;
  isTarget: boolean;
  subnets: Subnet[];
  sourceLinks: SubnetLink[];
  targetGroupType?: GroupType;
}

const GroupType: Record<string, GroupType> = {
  Region: {
    id: "Region",
    getGroupId: (subnet: Subnet) => `REGION_${subnet.region}`,
  },
  Vpc: {
    id: "Vpc",
    getGroupId: (subnet: Subnet) => `VPC_${subnet.vpc}`,
  },
  Subnet: {
    id: "Subnet",
    getGroupId: (subnet: Subnet) => `SUBNET_${subnet.subnet}`,
  },
};

export function computeWiredGraph(data: RawSubnetData): SubnetData {
  const { vertices: subnetIdToSubnet, edges: links } = data;

  for (const link of links) {
    if (link.localId === link.remoteId) {
      console.log("CYCLE", link);
    }
  }
  return {
    subnets: [...Object.values(subnetIdToSubnet)],
    links: links
      // ADAMTODO: Circular link is expected.
      .filter((l) => !isCircularLink(l))
      .map((v) => ({
        source: subnetIdToSubnet[v.localId] as Subnet,
        target: subnetIdToSubnet[v.remoteId] as Subnet,
        egressBytes: v.egressBytes,
        ingressBytes: v.ingressBytes,
      })),
  };

  //
  // TODO: Removing for now
  function isCircularLink(link: RawSubnetLink) {
    return link.localId === link.remoteId;
  }
}

export function computeSankeyGrouping(
  data: SubnetData,
  options: ComputeSankeyGroupingOptions
): SankeyGraph {
  const regionGroups = computeGroupedSubnets(data, GroupType.Region);
  const vpcGroups = computeGroupedSubnets(data, GroupType.Vpc);
  const subnetGroups = computeGroupedSubnets(data, GroupType.Subnet);

  const visibility = getColumnVisibility(options);
  const groups: SubnetGroup[] = [];
  const groupIdToSankeyNode = new Map<string, SankeyNode>();
  const columns = [];

  if (visibility.isSourceRegionsVisible) {
    const column: SankeyColumn = { nodes: [] };
    regionGroups
      .filter((v) => !v.isTarget)
      .forEach((group) => {
        const sankeyNode = createSankeyNode(group);
        groupIdToSankeyNode.set(group.id, sankeyNode);

        group.targetGroupType = visibility.columnTypes[columns.length + 1];
        groups.push(group);

        column.nodes.push(sankeyNode);
      });
    column.visibleRows = [0, column.nodes.length];
    columns.push(column);
  }
  if (visibility.isSourceVpcsVisible) {
    const column: SankeyColumn = { nodes: [] };
    vpcGroups
      .filter((v) => !v.isTarget)
      .forEach((group) => {
        const sankeyNode = createSankeyNode(group);
        groupIdToSankeyNode.set(group.id, sankeyNode);

        group.targetGroupType = visibility.columnTypes[columns.length + 1];
        groups.push(group);

        column.nodes.push(sankeyNode);
      });
    column.visibleRows = [0, column.nodes.length];
    columns.push(column);
  }
  if (visibility.isSourceSubnetsVisible) {
    const column: SankeyColumn = { nodes: [] };
    subnetGroups
      .filter((v) => !v.isTarget)
      .forEach((group) => {
        const sankeyNode = createSankeyNode(group);
        groupIdToSankeyNode.set(group.id, sankeyNode);

        group.targetGroupType = visibility.columnTypes[columns.length + 1];
        groups.push(group);

        column.nodes.push(sankeyNode);
      });
    column.visibleRows = [0, column.nodes.length];
    columns.push(column);
  }
  if (visibility.isTargetSubnetsVisible) {
    const column: SankeyColumn = { nodes: [] };
    subnetGroups
      .filter((v) => v.isTarget)
      .forEach((group) => {
        const sankeyNode = createSankeyNode(group);
        groupIdToSankeyNode.set(group.id, sankeyNode);

        group.targetGroupType = visibility.columnTypes[columns.length + 1];
        groups.push(group);

        column.nodes.push(sankeyNode);
      });
    column.visibleRows = [0, column.nodes.length];
    columns.push(column);
  }
  if (visibility.isTargetVpcsVisible) {
    const column: SankeyColumn = { nodes: [] };
    vpcGroups
      .filter((v) => v.isTarget)
      .forEach((group) => {
        const sankeyNode = createSankeyNode(group);
        groupIdToSankeyNode.set(group.id, sankeyNode);

        group.targetGroupType = visibility.columnTypes[columns.length + 1];
        groups.push(group);

        column.nodes.push(sankeyNode);
      });
    column.visibleRows = [0, column.nodes.length];
    columns.push(column);
  }
  if (visibility.isTargetRegionsVisible) {
    const column: SankeyColumn = { nodes: [] };
    regionGroups
      .filter((v) => v.isTarget)
      .forEach((group) => {
        const sankeyNode = createSankeyNode(group);
        groupIdToSankeyNode.set(group.id, sankeyNode);

        // group.targetGroupType = visibility.columnTypes[columns.length + 1];
        groups.push(group);

        column.nodes.push(sankeyNode);
      });
    column.visibleRows = [0, column.nodes.length];
    columns.push(column);
  }

  const sankeyLinks: SankeyLink[] = [];
  for (const group of groups) {
    if (!group.targetGroupType) {
      continue;
    }
    const groupSourceLinks = computeGroupLinks(groupIdToSankeyNode, group);
    for (const link of groupSourceLinks) {
      link.source.sourceLinks.push(link);
      link.target.targetLinks.push(link);
    }
    sankeyLinks.push(...groupSourceLinks);
  }

  return {
    nodes: [...groupIdToSankeyNode.values()],
    links: sankeyLinks,
    columns,
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
        isTarget: !idToSubnetSourceLinks.get(subnet.id)?.length,
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
  group: SubnetGroup
): SankeyLink[] {
  const targetGroupIdToLinks = new Map<string, SubnetLink[]>();
  for (const link of group.sourceLinks) {
    // @ts-ignore
    const targetGroupId = group.targetGroupType.getGroupId(link.target);
    if (!targetGroupIdToLinks.has(targetGroupId)) {
      targetGroupIdToLinks.set(targetGroupId, []);
    }

    targetGroupIdToLinks.get(targetGroupId)?.push(link);
  }

  return [...targetGroupIdToLinks.values()].map((links) => {
    return {
      source: groupIdToSankeyNode.get(group.id) as SankeyNode,
      target: groupIdToSankeyNode.get(
        // @ts-ignore
        group.targetGroupType.getGroupId(links[0].target)
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
  columnTypes: GroupType[];
} {
  const visibility = {
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

  return {
    ...visibility,
    columnTypes: [
      visibility.isSourceRegionsVisible ? GroupType.Region : null,
      visibility.isSourceVpcsVisible ? GroupType.Vpc : null,
      visibility.isSourceSubnetsVisible ? GroupType.Subnet : null,
      visibility.isTargetSubnetsVisible ? GroupType.Subnet : null,
      visibility.isTargetVpcsVisible ? GroupType.Vpc : null,
      visibility.isTargetRegionsVisible ? GroupType.Region : null,
    ].filter((v) => v) as GroupType[],
  };
}

function createSankeyNode(group: SubnetGroup): SankeyNode {
  return {
    id: group.id,
    sourceLinks: [],
    targetLinks: [],
  };
}
