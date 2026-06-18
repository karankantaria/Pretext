// Skin registry + profession categories. Adding a skin = writing a presentation
// component and listing it here; reading logic stays in the shared engine.

import type { SkinDef } from './types'
import CodeSkin from './CodeSkin'
import DashboardSkin from './DashboardSkin'
import TrainingSkin from './TrainingSkin'
import LogSkin from './LogSkin'
import SocSkin from './SocSkin'
import DiffSkin from './DiffSkin'
import WordSkin from './WordSkin'
import NewsSkin from './NewsSkin'
import DocsSkin from './DocsSkin'
import DesignSkin from './DesignSkin'

export interface SkinCategory {
  id: string
  label: string
  /** Who this category is for, shown under the section heading. */
  blurb: string
  accent: string
}

/** Display order of the wardrobe's profession groups. */
export const CATEGORIES: SkinCategory[] = [
  {
    id: 'engineering',
    label: 'Engineering & IT',
    blurb: 'For developers, sysadmins & security',
    accent: '#61afef'
  },
  {
    id: 'data',
    label: 'Data & ML',
    blurb: 'For analysts, data scientists & ML engineers',
    accent: '#a9c585'
  },
  {
    id: 'office',
    label: 'Office & Admin',
    blurb: 'For consultants, managers & operations',
    accent: '#185abd'
  },
  {
    id: 'media',
    label: 'Media & Research',
    blurb: 'For writers, journalists & researchers',
    accent: '#c0392b'
  },
  {
    id: 'creative',
    label: 'Creative & Design',
    blurb: 'For designers & creatives',
    accent: '#e5934b'
  }
]

export const SKINS: SkinDef[] = [
  {
    id: 'code',
    name: 'Source File',
    category: 'engineering',
    tagline: 'A syntax-highlighted Python module open in an editor',
    disguise: 'Book text hidden inside a class docstring',
    accent: '#61afef',
    available: true,
    Component: CodeSkin
  },
  {
    id: 'diff',
    name: 'Code Review',
    category: 'engineering',
    tagline: 'A pull-request diff under review',
    disguise: 'Text hidden as added + lines in a diff',
    accent: '#c678dd',
    available: true,
    Component: DiffSkin
  },
  {
    id: 'logs',
    name: 'Log Stream',
    category: 'engineering',
    tagline: 'A full-screen colour-coded server log console',
    disguise: 'Text hidden as the message part of each log line',
    accent: '#56b6c2',
    available: true,
    Component: LogSkin
  },
  {
    id: 'soc',
    name: 'Threat Map',
    category: 'engineering',
    tagline: 'A dark world map with glowing arcs and a threat feed',
    disguise: 'Text hidden as threat-feed event descriptions',
    accent: '#e06c75',
    available: true,
    Component: SocSkin
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    category: 'data',
    tagline: 'Live KPI tiles, charts and a streaming events table',
    disguise: 'Text hidden as recent-event rows',
    accent: '#a9c585',
    available: true,
    Component: DashboardSkin
  },
  {
    id: 'training',
    name: 'ML Training Run',
    category: 'data',
    tagline: 'Loss curves, epoch progress and a streaming training log',
    disguise: 'Text hidden as log lines and sample outputs',
    accent: '#e5c07b',
    available: true,
    Component: TrainingSkin
  },
  {
    id: 'word',
    name: 'Word Document',
    category: 'office',
    tagline: 'A corporate report open in a word processor',
    disguise: 'Text hidden as the document body',
    accent: '#185abd',
    available: true,
    Component: WordSkin
  },
  {
    id: 'docs',
    name: 'Google Docs',
    category: 'office',
    tagline: 'A shared doc with collaborators and a margin comment',
    disguise: 'Text hidden as the document body',
    accent: '#4285f4',
    available: true,
    Component: DocsSkin
  },
  {
    id: 'news',
    name: 'News Site',
    category: 'media',
    tagline: 'A newspaper front page with a live ticker and markets',
    disguise: 'Text hidden as the lead article body',
    accent: '#c0392b',
    available: true,
    Component: NewsSkin
  },
  {
    id: 'design',
    name: 'Design Canvas',
    category: 'creative',
    tagline: 'A vector editor with an editorial artboard under edit',
    disguise: 'Text hidden as the laid-out body copy',
    accent: '#e5934b',
    available: true,
    Component: DesignSkin
  }
]

export function getSkin(id: string): SkinDef | undefined {
  return SKINS.find((s) => s.id === id)
}
