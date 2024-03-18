import { TracingChannel } from "diagnostics_channel";
import {
  SubnetData,
  Subnet,
  SankeyGraph,
  SankeyNode,
  SankeyLink,
  SubnetLink,
  SankeyColumn,
  RawSubnetData,
} from "../src/models";
// const { vertices: subnets, edges: links } = data;

export interface ComputeSankeyGroupingOptions {
  sourceGroupType: "REGION" | "VPC" | "SUBNET";
  targetGroupType: "REGION" | "VPC" | "SUBNET";
  focusedNode?: string;
  // ADAMTODO: make cleaner
  visibleRowState: [
    [number, number], // Source Region
    [number, number], // Source VPC
    [number, number], // Source Subnet
    [number, number], // Target Subnet
    [number, number], // Target VPC
    [number, number] // Target Region
  ];
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
  groupType: GroupType;
  targetGroupType?: GroupType;
  columnIdx?: number;
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

/**
 * Create a distinct SOURCE and TARGET set of nodes to handle cycles
 * e.g. some traffic in 'us-west-1' may stay within 'us-west-1', which
 * presents as a cycle. Instead, we visualize this as a traffic flow
 * from the source 'us-west-1' to the target 'us-west-1'
 */
export function computeWiredGraph(data: RawSubnetData): SubnetData {
  const { vertices, edges: links } = data;

  const subnets = [...Object.values(vertices)].flatMap((v) => [
    v,
    {
      id: `TARGET_${v.id}`,
      account: `TARGET_${v.account}`,
      region: `TARGET_${v.region}`,
      vpc: `TARGET_${v.vpc}`,
      az: `TARGET_${v.az}`,
      subnet: `TARGET_${v.subnet}`,
    },
  ]);
  const subnetIdToSubnet = new Map<string, Subnet>(
    subnets.map((v) => [v.id, v])
  );
  return {
    subnets,
    links: links.flatMap((v) => [
      {
        source: subnetIdToSubnet.get(v.localId) as Subnet,
        target: subnetIdToSubnet.get(v.remoteId) as Subnet,
        egressBytes: v.egressBytes,
        ingressBytes: v.ingressBytes,
      },
      {
        source: subnetIdToSubnet.get(v.localId) as Subnet,
        target: subnetIdToSubnet.get(`TARGET_${v.remoteId}`) as Subnet,
        egressBytes: v.egressBytes,
        ingressBytes: v.ingressBytes,
      },
    ]),
  };
}

/**
 * Produce the Sankey graph/nodes/links from raw subnet data.
 * e.g. Mapping from raw data context to UI context
 */
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

  const columnSpecs = [
    {
      isVisible: visibility.isSourceRegionsVisible,
      groupType: GroupType.Region,
      groups: regionGroups.filter((v) => !v.isTarget),
      isTarget: false,
    },
    {
      isVisible: visibility.isSourceVpcsVisible,
      groupType: GroupType.Vpc,
      groups: vpcGroups.filter((v) => !v.isTarget),
      isTarget: false,
    },
    {
      isVisible: visibility.isSourceSubnetsVisible,
      groupType: GroupType.Subnet,
      groups: subnetGroups.filter((v) => !v.isTarget),
      isTarget: false,
    },
    {
      isVisible: visibility.isTargetSubnetsVisible,
      groupType: GroupType.Subnet,
      groups: subnetGroups.filter((v) => v.isTarget),
      isTarget: true,
    },
    {
      isVisible: visibility.isTargetVpcsVisible,
      groupType: GroupType.Vpc,
      groups: vpcGroups.filter((v) => v.isTarget),
      isTarget: true,
    },
    {
      isVisible: visibility.isTargetRegionsVisible,
      groupType: GroupType.Region,
      groups: regionGroups.filter((v) => v.isTarget),
      isTarget: true,
    },
  ];

  for (const [columnIdx, columnSpec] of columnSpecs.entries()) {
    if (!columnSpec.isVisible) {
      continue;
    }
    const isPreviousColumnLastSource = Boolean(
      !columns?.at(-1)?.isTarget && columnSpec?.isTarget
    );
    if (isPreviousColumnLastSource) {
      // @ts-ignore - Clean up, just adding high padding value here... should be param
      columns.at(-1).rightPadding = 600;
    }

    const column: SankeyColumn = {
      nodes: [],
      rightPadding: 0,
      columnIdx,
      isTarget: columnSpec.isTarget,
    };

    // TODO: IS this right?
    const nextVisibleGroupType = columnSpecs.filter((v) => v.isVisible)[
      columns.length + 1
    ]?.groupType;
    for (const group of columnSpec.groups) {
      // ADAMTODO: clean up (do we need mutation?)
      Object.assign(group, {
        columnIdx: columns.length,
        targetGroupType: nextVisibleGroupType,
      });

      const sankeyNode = createSankeyNode(group);
      groupIdToSankeyNode.set(group.id, sankeyNode);
      groups.push(group);

      column.nodes.push(sankeyNode);
    }

    const [prevMin, prevMax] = options.visibleRowState[columnIdx];
    column.visibleRows = [
      Math.max(prevMin, 0),
      Math.min(prevMax, column.nodes.length),
    ];
    columns.push(column);
  }

  const sankeyLinks: SankeyLink[] = [];
  for (const group of groups) {
    // TODO: Why is this check needed? Because final column has no outlinks?
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

/**
 * Produce one collapsed subnet "group" with all relevant links embedded
 */
function computeGroupedSubnets(
  data: SubnetData,
  groupType: GroupType
): SubnetGroup[] {
  const idToSubnetSourceLinks = getIdToSourceSubnetLinks(data.links);

  const groupIdToGroup = new Map<string, SubnetGroup>();
  for (const subnet of Object.values(data.subnets)) {
    const groupId = groupType.getGroupId(subnet);
    if (!groupIdToGroup.has(groupId)) {
      groupIdToGroup.set(groupId, {
        id: groupId,
        isTarget: !idToSubnetSourceLinks.get(subnet.id)?.length,
        subnets: [],
        sourceLinks: [],
        groupType,
      });
    }

    groupIdToGroup.get(groupId)?.subnets.push(subnet);
  }

  for (const subnetLink of data.links) {
    const sourceGroupId = groupType.getGroupId(subnetLink.source);
    if (groupIdToGroup.has(sourceGroupId)) {
      groupIdToGroup.get(sourceGroupId)?.sourceLinks.push(subnetLink);
    }
  }

  return [...groupIdToGroup.values()];
}

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
  const targetGroupIdToLinks = groupBy<SubnetLink>(
    group.sourceLinks,
    getTargetGroupId
  );
  console.log(targetGroupIdToLinks);
  return Object.values(targetGroupIdToLinks)
    .filter(isIncludedLinks)
    .map(toSankeyLinks);

  function getTargetGroupId(link: SubnetLink): string {
    // @ts-ignore
    return group.targetGroupType.getGroupId(link.target);
  }

  function isIncludedLinks(links: SubnetLink[]) {
    const targetNodeId = group.targetGroupType?.getGroupId(
      links[0].target
    ) as string;
    const targetNode = groupIdToSankeyNode.get(targetNodeId);

    // ADAMTODO: Examine approach here better. hacky quick fix
    // @ts-ignore
    const isAdjacent = group.columnIdx === targetNode?.__columnIndex - 1;
    // If is source,
    // ADAMNOTE: This is happening because we duplicate links and create source -> target, source -> source
    // If only source VPC are shown, for example, then targetVPC will not exist.
    return groupIdToSankeyNode.has(targetNodeId) && isAdjacent;
  }

  function toSankeyLinks(links: SubnetLink[]) {
    const targetNodeId = group.targetGroupType?.getGroupId(
      links[0].target
    ) as string;
    return {
      source: groupIdToSankeyNode.get(group.id) as SankeyNode,
      target: groupIdToSankeyNode.get(targetNodeId) as SankeyNode,
      value: links.reduce(
        (sum: number, v: SubnetLink) => sum + v.egressBytes + v.ingressBytes,
        0
      ),
    };
  }
}

// TODO: clean up hacks
function getColumnVisibility(options: ComputeSankeyGroupingOptions): {
  isSourceRegionsVisible: boolean;
  isSourceVpcsVisible: boolean;
  isSourceSubnetsVisible: boolean;

  // Target defined by filter
  isTargetSubnetsVisible: boolean;
  isTargetVpcsVisible: boolean;
  isTargetRegionsVisible: boolean;
} {
  const visibility = {
    // Source defined by filter plus clicks
    isSourceRegionsVisible: ["REGION"].includes(options.sourceGroupType),
    isSourceVpcsVisible:
      ["VPC"].includes(options.sourceGroupType) ||
      (options.sourceGroupType === "REGION" && !!options.focusedNode),
    isSourceSubnetsVisible:
      ["SUBNET"].includes(options.sourceGroupType) ||
      !!(
        options.focusedNode?.startsWith("VPC_") ||
        options.focusedNode?.startsWith("SUBNET_")
      ), // TODO: Fix hack

    // Target defined by filter
    isTargetSubnetsVisible: ["SUBNET"].includes(options.targetGroupType),
    isTargetVpcsVisible: ["SUBNET", "VPC"].includes(options.targetGroupType),
    isTargetRegionsVisible: ["SUBNET", "VPC", "REGION"].includes(
      options.targetGroupType
    ),
  };

  return {
    ...visibility,
  };
}

function createSankeyNode(group: SubnetGroup): SankeyNode {
  return {
    id: group.id,
    // @ts-ignore TODO fix
    displayName: group.id.split("_").at(-1),
    // @ts-ignore TODO fix
    __columnIndex: group.columnIdx,
    label: group.isTarget ? "right" : "left",
    sourceLinks: [],
    targetLinks: [],
  };
}

function groupBy<T>(values: T[], callback: any): Record<string, T[]> {
  return values.reduce((acc: Record<string, T[]>, currentValue) => {
    const key = callback(currentValue);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(currentValue);
    return acc;
  }, {});
}
