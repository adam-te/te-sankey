export interface SankeyNode {
  id: string; // 'us-east-1'
}

export interface SankeyLink {
  sourceId: string; // 'us-east-1'
  targetId: string; // 'us-east-2'
  value: number;
}

export interface SankeyGraph {
  nodes: SankeyNode[];
  links: SankeyLink[];
  columns: SankeyColumn[];
}
export interface SankeyColumn {
  nodes: SankeyNode[];
  visibleRows?: [number, number];
  rightPadding?: number;
}

export interface MetaGraph {
  nodes: NodeMeta[];
  links: LinkMeta[];
  columns: MetaColumn[];
}

export interface MetaColumn {
  nodes: NodeMeta[];
  visibleRows: [number, number];
  //   visibleStartIdx: number;
  rightPadding: number;
}

export interface LinkMeta {
  source: NodeMeta;
  target: NodeMeta;
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
export interface NodeMeta {
  id: string;

  sourceLinks: LinkMeta[]; // If source of link, in sourcelinks
  targetLinks: LinkMeta[]; // if target of link, in targetlinks
  isHidden?: boolean;

  height?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  linksEndY?: number; // Point at which
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
