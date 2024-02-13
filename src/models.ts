export interface SankeyNode {
  id: string; // 'us-east-1'
  // alignment: "right"; // if isDestNode - needed to know which side to show the flow on. if no alignment then stretched
}

export interface SankeyLink {
  sourceId: string; // 'us-east-1'
  targetId: string; // 'us-east-2'
  value: number; //
  //   successWeight: number; // 100,
  //   failedWeight: number; //50,
  // TODO: Need more granular structure here, so can highlight selected types of flows. get clarification
}

export interface SankeyGraph {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyConfig {
  extent: [[number, number], [number, number]]; // [[0, 1], [0, 1]]
  nodeWidth: number; // 24 // DEPRECATED
  // TODO: Not sure this was translated correctly
  nodeHeight: number; // 8 DEPRECATED - height based on flows. Support minHeight though
  nodePadding: number; // 0 DEPRECATED - rename nodeYPadding
  linkXPadding: number;
  columnIdxToPadding: Record<number, number>;

  //   padding: {
  //     column: {
  //       x: number;
  //       y: number;
  //     };
  //     node: {
  //       x: number;
  //       y: number;
  //     };
  //   };
  iterations: number; // 6
  numberOfVisibleRows: number; // All
  align: (node: NodeMeta, n: number) => number;
  visibleColumnsFromCenter: number;
}

export interface LinkMeta {
  source: NodeMeta;
  target: NodeMeta;
  value: number; //
  width?: number;
  y0?: number;
  y1?: number;
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
  // TODO: shouldn't use reference here unless updating when graph changes
  // TODO: What do they really mean?
  sourceLinks: LinkMeta[]; // If source of link, in sourcelinks
  targetLinks: LinkMeta[]; // if target of link, in targetlinks
  // means we get 2x links
  value: number;
  depth?: number; // How many iterations of BFS needed to hit the node
  inverseDepth?: number; // How many iterations of BFS needed to hit the node (from other side)

  isHidden: boolean;
  height?: number;
  layer?: number;

  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

export interface GraphMeta {
  nodes: Required<NodeMeta>[];
  links: Required<LinkMeta>[];
}
