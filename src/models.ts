export interface SankeyNode {
  id: string;

  sourceLinks: SankeyLink[]; // If source of link, in sourcelinks
  targetLinks: SankeyLink[]; // if target of link, in targetlinks
  isHidden?: boolean;

  height?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  linksEndY?: number; // Point at which
}

export interface SankeyLink {
  source: SankeyNode;
  target: SankeyNode;
  value: number; //
  isHidden?: boolean;
  start?: {
    x: number;
    y0: number;
    y1: number;
  };
  end?: {
    x: number;
    y0: number;
    y1: number;
  };
}

export interface SankeyGraph {
  nodes: SankeyNode[];
  links: SankeyLink[];
  columns: SankeyColumn[];
}
export interface SankeyColumn {
  nodes: SankeyNode[];
  visibleRows?: [number, number];
  rightPadding: number;
}

export interface SankeyConfig {
  graphMeta: {
    width: number;
    height: number;
  };
  nodeWidth: number; // 24 // DEPRECATED
  // TODO: Not sure this was translated correctly
  nodeHeight: number; // 8 DEPRECATED - height based on flows. Support minHeight though
  nodePadding: number; // 0 DEPRECATED - rename nodeYPadding
  linkXPadding: number;
}

export interface Subnet {
  id: string; // "036476006320-us-west-1-subnet-0c007c2b937018184",
  account: string; // "036476006320",
  region: string; // "us-west-1",
  vpc: string; // "vpc-01467758515c907ef",
  az: string; // "usw1-az1",
  subnet: string; // "subnet-0c007c2b937018184"
}

export interface RawSubnetLink {
  localId: string; // "036476006320-eu-central-1-subnet-018d43ab005a260d7",
  remoteId: string; // "036476006320-eu-central-1-subnet-018d43ab005a260d7",
  egressBytes: number; // 368849512,
  ingressBytes: number; // 971117237
}

export interface SubnetLink {
  source: Subnet;
  target: Subnet;
  egressBytes: number; // 368849512,
  ingressBytes: number; // 971117237
}

export interface RawSubnetData {
  vertices: Record<string, Subnet>;
  edges: RawSubnetLink[];
}

export interface SubnetData {
  subnets: Subnet[];
  links: SubnetLink[];
}
