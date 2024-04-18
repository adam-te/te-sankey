import { GroupType, SubnetData, SubnetGroup } from "./models"

/**
 * Produce one collapsed subnet "group" with all relevant links embedded
 */
export function computeGroupedSubnets(data: SubnetData, groupType: GroupType): SubnetGroup[] {
  const groupIdToGroup = new Map<string, SubnetGroup>()
  for (const subnet of Object.values(data.subnets)) {
    const groupId = groupType.getGroupId(subnet)
    if (!groupIdToGroup.has(groupId)) {
      groupIdToGroup.set(groupId, {
        id: groupId,
        name: groupType.getGroupName(subnet),
        isTarget: subnet.isTarget,
        subnets: [],
        links: [],
        groupType,
      })
    }

    groupIdToGroup.get(groupId)?.subnets.push(subnet)
  }

  for (const subnetLink of data.links) {
    const sourceGroupId = subnetLink.source && groupType.getGroupId(subnetLink.source)
    if (groupIdToGroup.has(sourceGroupId)) {
      groupIdToGroup.get(sourceGroupId)?.links.push(subnetLink)
    }
  }

  return [...groupIdToGroup.values()]
}
