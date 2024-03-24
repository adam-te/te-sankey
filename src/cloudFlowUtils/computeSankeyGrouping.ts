import {
  SankeyColumn,
  SankeyGraph,
  SankeyLink,
  SankeyNode,
} from "../sankeyUtils/models"
import { computeGroupLinks } from "./computeGroupLinks"
import { computeGroupedSubnets } from "./computeGroupedSubnets"
import { GroupType, SubnetData, SubnetGroup } from "./models"
// import { sortToMinimizeLinkCrossings } from "./sortToMinimizeLinkCrossings"

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
  selectedNodeIds: string[]
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
    const column: SankeyColumn = {
      id: `${
        columnSpec.isTarget ? "TARGET" : "SOURCE"
      }_${columnSpec.groupType.id.toUpperCase()}`,
      nodes: [],
      rightPadding: 0,
      isTarget: columnSpec.isTarget,
      visibleRows: [0, 0],
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

    const visibleRowsColumn = columnIdToColSpec.get(column.id)
    if (!visibleRowsColumn) {
      throw new Error(
        "Invalid column.id specified! It must be one of: (SOURCE/TARGET)_(REGION/VPC/SUBNET)"
      )
    }
    const [prevMin, prevMax] = visibleRowsColumn.visibleRows
    column.visibleRows = [
      Math.max(prevMin, 0),
      Math.min(prevMax, column.nodes.length),
    ]
    columns.push(column)
  }

  const sankeyLinks: SankeyLink[] = []
  for (const group of groups) {
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

  return {
    nodes: [...groupIdToSankeyNode.values()],
    links: sankeyLinks,
    columns,
  }
}

function getColumnVisibility(options: ComputeSankeyGroupingOptions): {
  isSourceRegionsVisible: boolean
  isSourceVpcsVisible: boolean
  isSourceSubnetsVisible: boolean
  isTargetSubnetsVisible: boolean
  isTargetVpcsVisible: boolean
  isTargetRegionsVisible: boolean
} {
  return {
    isSourceRegionsVisible: ["REGION"].includes(options.sourceGroupType),
    isSourceVpcsVisible:
      ["VPC"].includes(options.sourceGroupType) ||
      (options.sourceGroupType === "REGION" &&
        !!options.selectedNodeIds.length),
    isSourceSubnetsVisible:
      ["SUBNET"].includes(options.sourceGroupType) ||
      !!options.selectedNodeIds.some(
        v => v.startsWith("VPC_") || v.startsWith("SUBNET_") // TODO: Fix hacky string inference
      ),
    isTargetSubnetsVisible: ["SUBNET"].includes(options.targetGroupType),
    isTargetVpcsVisible: ["SUBNET", "VPC"].includes(options.targetGroupType),
    isTargetRegionsVisible: ["SUBNET", "VPC", "REGION"].includes(
      options.targetGroupType
    ),
  }
}

function createSankeyNode(group: SubnetGroup): SankeyNode {
  return {
    id: group.id,
    displayName: group.id.split("_").at(-1) as string,
    label: group.isTarget ? "right" : "left",
    sourceLinks: [],
    targetLinks: [],
  }
}
