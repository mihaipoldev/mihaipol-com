/**
 * State Badge Component
 * 
 * Generic badge for displaying item states with icons and colored backgrounds
 * Supports common states like published, draft, paused, archived, etc.
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCheckCircle, 
  faPencil, 
  faPause, 
  faArchive,
  faEye,
  faStar,
  faLightbulb,
  faTimes,
  faExclamationTriangle,
  faWrench,
  faCircleXmark,
  faCalendar,
  faClock,
  type IconDefinition
} from '@fortawesome/free-solid-svg-icons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StateType = 
  | 'published' 
  | 'draft' 
  | 'scheduled'
  | 'paused' 
  | 'archived' 
  | 'preview'
  | 'active'
  | 'inactive'
  | 'upcoming'
  | 'past'
  | 'cancelled'
  | 'prospect'
  | 'disabled'
  | 'error'
  | 'maintenance'
  | 'deprecated'

interface StateBadgeConfig {
  icon?: IconDefinition
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  className: string
}

interface StateBadgeProps {
  state: StateType
  className?: string
  /**
   * Custom label override (uses state-based label if not provided)
   */
  label?: string
}

const STATE_CONFIGS: Record<StateType, StateBadgeConfig> = {
  published: {
    icon: faCheckCircle,
    label: 'Published',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100/80 dark:hover:bg-green-900/40 transition-colors duration-200'
  },
  draft: {
    icon: faPencil,
    label: 'Draft',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100/75 dark:hover:bg-gray-900/75 transition-colors duration-200'
  },
  scheduled: {
    icon: faCalendar,
    label: 'Scheduled',
    variant: 'outline',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100/75 dark:hover:bg-blue-900/40 transition-colors duration-200'
  },
  paused: {
    icon: faPause,
    label: 'Paused',
    variant: 'outline',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100/75 dark:hover:bg-orange-900/40 transition-colors duration-200'
  },
  archived: {
    icon: faArchive,
    label: 'Archived',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100/75 dark:hover:bg-red-900/40 transition-colors duration-200'
  },
  preview: {
    icon: faEye,
    label: 'Preview',
    variant: 'outline',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100/75 dark:hover:bg-blue-900/40 transition-colors duration-200'
  },
  active: {
    icon: faStar,
    label: 'Active',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200/75 dark:hover:bg-green-900/40 transition-colors duration-200'
  },
  inactive: {
    icon: faPause,
    label: 'Inactive',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100/75 dark:hover:bg-gray-800/90 transition-colors duration-200'
  },
  upcoming: {
    label: 'Upcoming',
    variant: 'outline',
    className: 'text-foreground/70 dark:text-foreground/60 border-border/50 hover:bg-muted/50 transition-colors duration-200'
  },
  past: {
    label: 'Past',
    variant: 'outline',
    className: 'text-foreground/70 dark:text-foreground/60 border-border/50 hover:bg-muted/50 transition-colors duration-200'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    className: 'text-foreground/70 dark:text-foreground/60 border-border/50 hover:bg-muted/50 transition-colors duration-200'
  },
  prospect: {
    icon: faLightbulb,
    label: 'Prospect',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100/75 dark:hover:bg-yellow-900/40 transition-colors duration-200'
  },
  disabled: {
    icon: faTimes,
    label: 'Disabled',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100/75 dark:hover:bg-gray-900/75 transition-colors duration-200'
  },
  error: {
    icon: faExclamationTriangle,
    label: 'Error',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100/75 dark:hover:bg-red-900/40 transition-colors duration-200'
  },
  maintenance: {
    icon: faWrench,
    label: 'Maintenance',
    variant: 'outline',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100/75 dark:hover:bg-orange-900/40 transition-colors duration-200'
  },
  deprecated: {
    icon: faCircleXmark,
    label: 'Deprecated',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100/75 dark:hover:bg-gray-900/75 transition-colors duration-200'
  }
}

export function StateBadge({ state, className, label }: StateBadgeProps) {
  const config = STATE_CONFIGS[state]
  
  // Fallback for unknown states
  if (!config) {
    console.warn(`StateBadge: Unknown state "${state}". Using default fallback.`)
    return (
      <Badge 
        variant="secondary" 
        className={cn('bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', className)}
      >
        <FontAwesomeIcon icon={faTimes} className="w-3 h-3 mr-1" />
        {label || state}
      </Badge>
    )
  }
  
  const displayLabel = label || config.label

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.icon && (
        <FontAwesomeIcon icon={config.icon} className="w-3 h-3 mr-1" />
      )}
      {displayLabel}
    </Badge>
  )
}

