// Skin registry. Adding a skin = writing a presentation component and listing
// it here; reading logic stays in the shared engine. `available: false` skins
// appear in the gallery as "coming soon".

import type { SkinDef } from './types'
import CodeSkin from './CodeSkin'

export const SKINS: SkinDef[] = [
  {
    id: 'code',
    name: 'Source File',
    tagline: 'A syntax-highlighted Python module open in an editor',
    disguise: 'Book text hidden inside a class docstring',
    accent: '#61afef',
    available: true,
    Component: CodeSkin
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    tagline: 'Live KPI tiles, charts and a streaming events table',
    disguise: 'Text hidden as recent-event rows',
    accent: '#a9c585',
    available: false
  },
  {
    id: 'training',
    name: 'ML Training Run',
    tagline: 'Loss curves, epoch progress and a streaming training log',
    disguise: 'Text hidden as log lines and sample outputs',
    accent: '#e5c07b',
    available: false
  },
  {
    id: 'logs',
    name: 'Log Stream',
    tagline: 'A full-screen colour-coded server log console',
    disguise: 'Text hidden as the message part of each log line',
    accent: '#56b6c2',
    available: false
  },
  {
    id: 'soc',
    name: 'Threat Map',
    tagline: 'A dark world map with glowing arcs and a threat feed',
    disguise: 'Text hidden as threat-feed event descriptions',
    accent: '#e06c75',
    available: false
  },
  {
    id: 'diff',
    name: 'Code Review',
    tagline: 'A pull-request diff under review',
    disguise: 'Text hidden as added + lines in a diff',
    accent: '#c678dd',
    available: false
  }
]

export function getSkin(id: string): SkinDef | undefined {
  return SKINS.find((s) => s.id === id)
}
