import {
  SankeyColumn,
  SankeyGraph,
  SankeyLink,
  SankeyNode,
} from "../sankeyUtils/models"
import { computeGroupLinks } from "./computeGroupLinks"
import { computeGroupedSubnets } from "./computeGroupedSubnets"
import { GroupType, SubnetData, SubnetGroup } from "./models"
import { sortToMinimizeLinkCrossings } from "./sortToMinimizeLinkCrossings"

type ColumnId =
  | "SOURCE_REGION"
  | "SOURCE_VPC"
  | "SOURCE_SUBNET"
  | "TARGET_SUBNET"
  | "TARGET_VPC"
  | "TARGET_REGION"

interface ColumnSpec {
  id: ColumnId
  visibleRows: [number, number]
}

export interface ComputeSankeyGroupingOptions {
  sourceGroupType: "REGION" | "VPC" | "SUBNET"
  targetGroupType: "REGION" | "VPC" | "SUBNET"
  focusedNodeId?: string
  columnSpecs: ColumnSpec[]
}

/**
 * Produce the Sankey graph/nodes/links from raw subnet data.
 * e.g. Mapping from raw data context to UI context
 */
export function computeSankeyGrouping(
  data: SubnetData,
  options: ComputeSankeyGroupingOptions
): SankeyGraph {
  const regionGroups = computeGroupedSubnets(data, GroupType.Region)
  const vpcGroups = computeGroupedSubnets(data, GroupType.Vpc)
  const subnetGroups = computeGroupedSubnets(data, GroupType.Subnet)

  const visibility = getColumnVisibility(options)
  const groups: SubnetGroup[] = []
  const groupIdToSankeyNode = new Map<string, SankeyNode>()
  const groupIdToColIdx = new Map<string, number>()
  const columnIdToColSpec = new Map<string, ColumnSpec>(
    options.columnSpecs.map(v => [v.id, v])
  )
  const columns = []

  const columnSpecs = [
    {
      isVisible: visibility.isSourceRegionsVisible,
      groupType: GroupType.Region,
      groups: regionGroups.filter(v => !v.isTarget),
      isTarget: false,
    },
    {
      isVisible: visibility.isSourceVpcsVisible,
      groupType: GroupType.Vpc,
      groups: vpcGroups.filter(v => !v.isTarget),
      isTarget: false,
    },
    {
      isVisible: visibility.isSourceSubnetsVisible,
      groupType: GroupType.Subnet,
      groups: subnetGroups.filter(v => !v.isTarget),
      isTarget: false,
    },
    {
      isVisible: visibility.isTargetSubnetsVisible,
      groupType: GroupType.Subnet,
      groups: subnetGroups.filter(v => v.isTarget),
      isTarget: true,
    },
    {
      isVisible: visibility.isTargetVpcsVisible,
      groupType: GroupType.Vpc,
      groups: vpcGroups.filter(v => v.isTarget),
      isTarget: true,
    },
    {
      isVisible: visibility.isTargetRegionsVisible,
      groupType: GroupType.Region,
      groups: regionGroups.filter(v => v.isTarget),
      isTarget: true,
    },
  ]

  const visibleColumnSpecs = columnSpecs.filter(c => c.isVisible)
  for (const columnSpec of visibleColumnSpecs) {
    const isPreviousColumnLastSource = Boolean(
      !columns?.at(-1)?.isTarget && columnSpec?.isTarget
    )
    if (isPreviousColumnLastSource) {
      // @ts-ignore - Clean up, just adding high padding value here... should be param
      columns.at(-1).rightPadding = 600
    }

    const column: SankeyColumn = {
      id: `${
        columnSpec.isTarget ? "TARGET" : "SOURCE"
      }_${columnSpec.groupType.id.toUpperCase()}`,
      nodes: [],
      rightPadding: 0,
      isTarget: columnSpec.isTarget,
    }

    const nextVisibleGroupType =
      visibleColumnSpecs[columns.length + 1]?.groupType

    for (const group of columnSpec.groups) {
      group.targetGroupType = nextVisibleGroupType
      groupIdToColIdx.set(group.id, columns.length)
      groups.push(group)

      const sankeyNode = createSankeyNode(group)
      groupIdToSankeyNode.set(group.id, sankeyNode)
      column.nodes.push(sankeyNode)
    }

    const columnVisibleRows = columnIdToColSpec.get(column.id)
    if (!columnVisibleRows) {
      throw new Error(
        "Invalid column.id specified! It must be one of: (SOURCE/TARGET)_(REGION/VPC/SUBNET)"
      )
    }
    const [prevMin, prevMax] = columnVisibleRows.visibleRows
    column.visibleRows = [
      Math.max(prevMin, 0),
      Math.min(prevMax, column.nodes.length),
    ]
    columns.push(column)
  }

  const sankeyLinks: SankeyLink[] = []
  for (const group of groups) {
    // TODO: Why is this check needed? Because final column has no outlinks?
    if (!group.targetGroupType) {
      continue
    }

    const groupSourceLinks = computeGroupLinks({
      groupIdToColIdx,
      groupIdToSankeyNode,
      group,
    })

    for (const link of groupSourceLinks) {
      link.source.sourceLinks.push(link)
      link.target.targetLinks.push(link)
    }
    sankeyLinks.push(...groupSourceLinks)
  }

  const sankeyNodes = [...groupIdToSankeyNode.values()]

  // TODO: Profile
  sortToMinimizeLinkCrossings({
    columns,
    numberOfIterations: 6,
  })

  return {
    nodes: sankeyNodes,
    links: sankeyLinks,
    columns,
  }
}

function getColumnVisibility(options: ComputeSankeyGroupingOptions): {
  isSourceRegionsVisible: boolean
  isSourceVpcsVisible: boolean
  isSourceSubnetsVisible: boolean

  // Target defined by filter
  isTargetSubnetsVisible: boolean
  isTargetVpcsVisible: boolean
  isTargetRegionsVisible: boolean
} {
  const visibility = {
    // Source defined by filter plus clicks
    isSourceRegionsVisible: ["REGION"].includes(options.sourceGroupType),
    isSourceVpcsVisible:
      ["VPC"].includes(options.sourceGroupType) ||
      (options.sourceGroupType === "REGION" && !!options.focusedNodeId),
    isSourceSubnetsVisible:
      ["SUBNET"].includes(options.sourceGroupType) ||
      !!(
        options.focusedNodeId?.startsWith("VPC_") ||
        options.focusedNodeId?.startsWith("SUBNET_")
      ), // TODO: Fix hacky string inference

    // Target defined by filter
    isTargetSubnetsVisible: ["SUBNET"].includes(options.targetGroupType),
    isTargetVpcsVisible: ["SUBNET", "VPC"].includes(options.targetGroupType),
    isTargetRegionsVisible: ["SUBNET", "VPC", "REGION"].includes(
      options.targetGroupType
    ),
  }

  return {
    ...visibility,
  }
}

function createSankeyNode(group: SubnetGroup): SankeyNode {
  return {
    id: group.id,
    // @ts-ignore TODO fix
    displayName: group.id.split("_").at(-1),
    label: group.isTarget ? "right" : "left",
    sourceLinks: [],
    targetLinks: [],
  }
}
