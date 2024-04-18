import { SankeyLink, SankeyNode } from "../sankeyUtils/models"
import { SubnetGroup, SubnetLink } from "./models"

export function computeGroupLinks({
  groupIdToColIdx,
  groupIdToSankeyNode,
  group,
}: {
  groupIdToColIdx: Map<string, number>
  groupIdToSankeyNode: Map<string, SankeyNode>
  group: SubnetGroup
}): SankeyLink[] {
  const targetGroupIdToLinks = groupBy<SubnetLink>(
    group.links,
    getTargetGroupId
  )

  return Object.values(targetGroupIdToLinks)
    .filter(isIncludedLinks)
    .map(toSankeyLinks)

  function getTargetGroupId(link: SubnetLink): string {
    // @ts-ignore
    return link.target && group.targetGroupType.getGroupId(link.target)
  }

  function getSourceGroupId(link: SubnetLink): string {
    // @ts-ignore
    return group.groupType.getGroupId(link.source)
  }

  // TODO: Can we filter these out earlier for better perf?
  // Filtering out non-adjacent links
  function isLinkPointingToAdjacentColumn(link: SubnetLink): boolean {
    const sourceGroupId = getSourceGroupId(link)
    const targetGroupId = getTargetGroupId(link)

    return (
      groupIdToColIdx.get(sourceGroupId) ===
      (groupIdToColIdx?.get(targetGroupId) || 0) - 1
    )
  }

  function isTargetNodeVisible(link: SubnetLink): boolean {
    const targetNodeId = getTargetGroupId(link)
    return groupIdToSankeyNode.has(targetNodeId)
  }

  function isIncludedLinks(links: SubnetLink[]): boolean {
    const linkCandidate = links[0]
    return (
      isTargetNodeVisible(linkCandidate) &&
      isLinkPointingToAdjacentColumn(linkCandidate)
    )
  }

  function toSankeyLinks(links: SubnetLink[]) {
    const targetNodeId = getTargetGroupId(links[0])
    return {
      source: groupIdToSankeyNode.get(group.id) as SankeyNode,
      target: groupIdToSankeyNode.get(targetNodeId) as SankeyNode,
      value: links.reduce(
        // TODO: What does it mean for a link to have ingress and egress bytes? not logical
        (sum: number, v: SubnetLink) => sum + v.egressBytes + v.ingressBytes,
        0
      ),
    }
  }
}

function groupBy<T>(values: T[], callback: any): Record<string, T[]> {
  return values.reduce((acc: Record<string, T[]>, currentValue) => {
    const key = callback(currentValue)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(currentValue)
    return acc
  }, {})
}
