export interface SankeyNode {
  id: string
  displayName: string
  label: string

  sourceLinks: (SankeyLink | MergedSankeyLink)[] // If source of link, in sourcelinks
  targetLinks: (SankeyLink | MergedSankeyLink)[] // if target of link, in targetlinks
  isHidden?: boolean

  height?: number
  x0?: number
  x1?: number
  y0?: number
  y1?: number
  linksEndY?: number // Point at which
}

export interface SankeyLink {
  source: SankeyNode
  target: SankeyNode
  value: number //
  isHidden?: boolean
  start?: {
    x: number
    y0: number
    y1: number
  }
  end?: {
    x: number
    y0: number
    y1: number
  }
}

export interface MergedSankeyLink {
  links: SankeyLink[]
  value: number //
  isHidden?: boolean
  start?: {
    x: number
    y0: number
    y1: number
  }
  end?: {
    x: number
    y0: number
    y1: number
  }
}

export interface MergedSankeyLink {
  source: SankeyNode
  target: SankeyNode
  value: number //
  isHidden?: boolean
  start?: {
    x: number
    y0: number
    y1: number
  }
  end?: {
    x: number
    y0: number
    y1: number
  }
}

export interface SankeyGraph {
  nodes: SankeyNode[]
  links: (SankeyLink | MergedSankeyLink)[]
  columns: SankeyColumn[]
}
export interface StaticLink {
  visibleValue: number
  totalValue: number
}

export interface SankeyColumn {
  id: string
  nodes: SankeyNode[]
  staticLink?: StaticLink
  visibleRows: [number, number]
  rightPadding: number
  isTarget: boolean // TODO: May be removed
  flows?: {
    visible: number
    total: number
  }
}

export interface SankeyConfig {
  width: number
  height: number
  nodeWidth: number // 24
  nodeYPadding: number // 0
  linkXPadding: number
}
