import { SankeyColumn, SankeyGraph } from "../sankeyUtils"

export interface GroupType {
  id: string
  getGroupId: (subnet: Subnet) => string
}

export interface SubnetGroup {
  id: string
  isTarget: boolean
  subnets: Subnet[]
  links: SubnetLink[]
  groupType: GroupType
  targetGroupType?: GroupType
}

export const GroupType: Record<string, GroupType> = {
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
}

export interface RawSubnet {
  id: string // "036476006320-us-west-1-subnet-0c007c2b937018184",
  account: string // "036476006320",
  region: string // "us-west-1",
  vpc: string // "vpc-01467758515c907ef",
  az: string // "usw1-az1",
  subnet: string // "subnet-0c007c2b937018184"
}

export interface Subnet {
  id: string // "036476006320-us-west-1-subnet-0c007c2b937018184",
  account: string // "036476006320",
  region: string // "us-west-1",
  vpc: string // "vpc-01467758515c907ef",
  az: string // "usw1-az1",
  subnet: string // "subnet-0c007c2b937018184"
  /** Whether this is a "target" version of the subnet. If not a target, it is a source */
  isTarget: boolean
}

export interface RawSubnetLink {
  localId: string // "036476006320-eu-central-1-subnet-018d43ab005a260d7",
  remoteId: string // "036476006320-eu-central-1-subnet-018d43ab005a260d7",
  egressBytes: number // 368849512,
  ingressBytes: number // 971117237
}

export interface SubnetLink {
  source: Subnet
  target: Subnet
  egressBytes: number // 368849512,
  ingressBytes: number // 971117237
}

export interface RawSubnetData {
  vertices: Record<string, RawSubnet>
  edges: RawSubnetLink[]
}

export interface SubnetData {
  subnets: Subnet[]
  links: SubnetLink[]
}

export type DisplaySankeyColumn = SankeyColumn & {
  hasHiddenTopNodes: boolean
  hasHiddenBottomNodes: boolean
  flows?: {
    visible: number
    total: number
  }
}

export interface DisplaySankeyGraph {
  nodes: SankeyGraph["nodes"]
  links: SankeyGraph["links"]
  columns: DisplaySankeyColumn[]
}
