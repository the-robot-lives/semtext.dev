export type SemTextNode = {
  tag: string
  attrs: Readonly<Record<string, string>>
  line: number
  children: SemTextNode[]
}

export type SemTextDoc = {
  source: string
  fileName?: string
  tree: SemTextNode[]
  elementCount: number
  unknownElements: string[]
  firstSeen: number
}

declare module 'claude-code' {
  interface PluginState {
    semtext: {
      doc: SemTextDoc | null
      seenSources: string[]
    }
  }
}
