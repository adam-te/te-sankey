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

type ColumnId =
  | "SOURCE_REGION"
  | "SOURCE_VPC"
  | "SOURCE_SUBNET"
  | "TARGET_SUBNET"
  | "TARGET_VPC"
  | "TARGET_REGION";

interface ColumnSpec {
  id: ColumnId;
  visibleRows: [number, number];
}
export interface ComputeSankeyGroupingOptions {
  sourceGroupType: "REGION" | "VPC" | "SUBNET";
  targetGroupType: "REGION" | "VPC" | "SUBNET";
  focusedNode?: string;
  columnSpecs: ColumnSpec[];
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
  const groupIdToColIdx = new Map<string, number>();
  const columnIdToColSpec = new Map<string, ColumnSpec>(
    options.columnSpecs.map((v) => [v.id, v])
  );
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

  const visibleColumnSpecs = columnSpecs.filter((c) => c.isVisible);
  for (const columnSpec of visibleColumnSpecs) {
    const isPreviousColumnLastSource = Boolean(
      !columns?.at(-1)?.isTarget && columnSpec?.isTarget
    );
    if (isPreviousColumnLastSource) {
      // @ts-ignore - Clean up, just adding high padding value here... should be param
      columns.at(-1).rightPadding = 600;
    }

    const column: SankeyColumn = {
      id: `${
        columnSpec.isTarget ? "TARGET" : "SOURCE"
      }_${columnSpec.groupType.id.toUpperCase()}`,
      nodes: [],
      rightPadding: 0,
      isTarget: columnSpec.isTarget,
    };

    const nextVisibleGroupType =
      visibleColumnSpecs[columns.length + 1]?.groupType;

    for (const group of columnSpec.groups) {
      // ADAMTODO: clean up (do we need mutation?)
      group.targetGroupType = nextVisibleGroupType;
      groupIdToColIdx.set(group.id, columns.length);
      groups.push(group);

      const sankeyNode = createSankeyNode(group);
      groupIdToSankeyNode.set(group.id, sankeyNode);
      column.nodes.push(sankeyNode);
    }

    const columnVisibleRows = columnIdToColSpec.get(column.id);
    if (!columnVisibleRows) {
      throw new Error(
        "Invalid column.id specified! It must be one of: (SOURCE/TARGET)_(REGION/VPC/SUBNET)"
      );
    }
    const [prevMin, prevMax] = columnVisibleRows.visibleRows;
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

    const groupSourceLinks = computeGroupLinks({
      groupIdToColIdx,
      groupIdToSankeyNode,
      group,
    });

    for (const link of groupSourceLinks) {
      link.source.sourceLinks.push(link);
      link.target.targetLinks.push(link);
    }
    sankeyLinks.push(...groupSourceLinks);
  }

  const sankeyNodes = [...groupIdToSankeyNode.values()];

  // Sort smallest links first:
  // 1) For to make flows more obvious
  // 2) To allow for padding reduction to work with single pass
  // Note: May want to revisit this design decision
  for (const node of sankeyNodes) {
    node.sourceLinks.sort((a, b) => a.value - b.value);
    node.targetLinks.sort((a, b) => a.value - b.value);
  }

  // TODO: Profile
  sortToMinimizeLinkCrossings({
    columns,
    numberOfIterations: 6,
  });

  return {
    nodes: sankeyNodes,
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
  const groupIdToGroup = new Map<string, SubnetGroup>();
  for (const subnet of Object.values(data.subnets)) {
    const groupId = groupType.getGroupId(subnet);
    if (!groupIdToGroup.has(groupId)) {
      groupIdToGroup.set(groupId, {
        id: groupId,
        isTarget: subnet.isTarget,
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

function computeGroupLinks({
  groupIdToColIdx,
  groupIdToSankeyNode,
  group,
}: {
  groupIdToColIdx: Map<string, number>;
  groupIdToSankeyNode: Map<string, SankeyNode>;
  group: SubnetGroup;
}): SankeyLink[] {
  const targetGroupIdToLinks = groupBy<SubnetLink>(
    group.sourceLinks,
    getTargetGroupId
  );

  return Object.values(targetGroupIdToLinks)
    .filter(isIncludedLinks)
    .map(toSankeyLinks);

  function getTargetGroupId(link: SubnetLink): string {
    // @ts-ignore
    return group.targetGroupType.getGroupId(link.target);
  }

  function getSourceGroupId(link: SubnetLink): string {
    // @ts-ignore
    return group.groupType.getGroupId(link.source);
  }

  // ADAMTODO: Examine approach here better. hacky quick fix
  // Filtering out non-adjacent links, as link
  function isLinkPointingToAdjacentColumn(link: SubnetLink): boolean {
    const sourceGroupId = getSourceGroupId(link);
    const targetGroupId = getTargetGroupId(link);

    return (
      groupIdToColIdx.get(sourceGroupId) ===
      (groupIdToColIdx?.get(targetGroupId) || 0) - 1
    );
  }

  function isTargetNodeVisible(link: SubnetLink): boolean {
    const targetNodeId = getTargetGroupId(link);
    return groupIdToSankeyNode.has(targetNodeId);
  }

  function isIncludedLinks(links: SubnetLink[]): boolean {
    const linkCandidate = links[0];
    return (
      isTargetNodeVisible(linkCandidate) &&
      isLinkPointingToAdjacentColumn(linkCandidate)
    );
  }

  function toSankeyLinks(links: SubnetLink[]) {
    const targetNodeId = getTargetGroupId(links[0]);
    return {
      source: groupIdToSankeyNode.get(group.id) as SankeyNode,
      target: groupIdToSankeyNode.get(targetNodeId) as SankeyNode,
      value: links.reduce(
        // TODO:
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

/**
 * Sorts all columns iteratively based on the neighboring column indices to minimize
 * "link crossings" between columns. This uses a standard "sort by barycentric center"
 * approach.
 */
function sortToMinimizeLinkCrossings({
  columns,
  numberOfIterations,
}: {
  columns: SankeyColumn[];
  numberOfIterations: number;
}): void {
  for (let i = 0; i < numberOfIterations; i++) {
    for (let j = 0; j < columns.length - 1; j++) {
      const column = columns[j];
      const nextColumn = columns[j + 1];
      sortNodesByBarycenter(column, nextColumn);
    }
  }

  function sortNodesByBarycenter(
    column: SankeyColumn,
    nextColumn: SankeyColumn
  ) {
    const nodeIdToNextColumnIdx = new Map(
      nextColumn.nodes.map((node, index) => [node.id, index])
    );
    return column.nodes.sort((a, b) => {
      const aBarycenter = calculateBarycenter(a) || Infinity;
      const bBarycenter = calculateBarycenter(b) || Infinity;
      return aBarycenter - bBarycenter;
    });

    function calculateBarycenter(node: SankeyNode) {
      const linkMidpoints = node.sourceLinks.map((v) => {
        const isLinkTargetInNextColumn = nodeIdToNextColumnIdx.has(v.target.id);
        if (!isLinkTargetInNextColumn) {
          throw new Error(
            "Link is pointing to a node that is not in the neighboring column!"
          );
        }
        return nodeIdToNextColumnIdx.get(v.target.id) as number;
      });

      return linkMidpoints.length
        ? linkMidpoints.reduce((a, b) => a + b, 0) / linkMidpoints.length
        : null;
    }
  }
}
