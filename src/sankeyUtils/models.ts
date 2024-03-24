export interface SankeyNode {
  id: string
  displayName: string
  label: string

  // sourceLinks: SankeyLink[] // If source of link, in sourcelinks
  // targetLinks: SankeyLink[] // if target of link, in targetlinks
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

export interface SankeyGraph {
  nodes: SankeyNode[]
  links: SankeyLink[]
  columns: SankeyColumn[]
}
export interface SankeyColumn {
  id: string
  nodes: SankeyNode[]
  visibleRows: [number, number]
  rightPadding: number
  isTarget: boolean // TODO: May be removed
}

export interface SankeyConfig {
  width: number
  height: number
  nodeWidth: number // 24
  nodeYPadding: number // 0
  linkXPadding: number
}
