export type GradientPreset = {
  name: string
  description?: string
  classes: string
}

// Component-specific gradient presets
// Each component has its own dedicated preset that can be customized independently
export const gradientPresets = {
  header: {
    name: "Header",
    description: "Header background gradient",
    classes: "backdrop-blur-sm bg-transparent"
  },
  sidebar: {
    name: "Sidebar",
    description: "Sidebar background gradient",
    classes: "backdrop-blur-sm bg-gradient-to-br bg-sidebar "
  },
  sidebarAccent: {
    name: "Sidebar Accent",
    description: "Sidebar accent gradient for active/hover states",
    classes: "bg-primary/8 sidebar-accent-glow"
  },
  background: {
    name: "Background",
    description: "Main layout background gradient",
    classes: "backdrop-blur-sm from-primary/[1%] to-background"
  },
  card: {
    name: "Card",
    description: "Card background gradient",
    classes: "backdrop-blur-sm bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent"
  },
  table: {
    name: "Table",
    description: "Table background gradient",
    classes: "backdrop-blur-sm bg-gradient-to-br bg-card "
  },
  analytics: {
    name: "Analytics",
    description: "Analytics dashboard background gradient",
    classes: "backdrop-blur-sm bg-gradient-to-br bg-card "
  },
  interactive: {
    name: "Interactive",
    description: "Hover/active state gradient",
    classes: "backdrop-blur-sm bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
  },
} as const

// Component-specific gradient functions
export function getHeaderGradient(): string {
  return gradientPresets.header.classes
}

export function getSidebarGradient(): string {
  return gradientPresets.sidebar.classes
}

export function getSidebarAccentGradient(): string {
  return gradientPresets.sidebarAccent.classes
}

export function getBackgroundGradient(): string {
  return gradientPresets.background.classes
}

export function getCardGradient(): string {
  return gradientPresets.card.classes
}

export function getTableGradient(): string {
  return gradientPresets.table.classes
}

export function getAnalyticsGradient(): string {
  return gradientPresets.analytics.classes
}

export function getInteractiveGradient(): string {
  return gradientPresets.interactive.classes
}

// Generic function - uses background preset by default
export function getGradient(): string {
  return gradientPresets.background.classes
}

export function getGradientWithDark(preset?: keyof typeof gradientPresets): string {
  const presetToUse = preset || "background"
  const classes = gradientPresets[presetToUse].classes
  // Add dark: prefix to each class, but handle pseudo-classes correctly
  return classes.split(' ').map(cls => {
    // Skip empty strings
    if (!cls) return cls
    // Add dark: prefix
    return `dark:${cls}`
  }).join(' ')
}


