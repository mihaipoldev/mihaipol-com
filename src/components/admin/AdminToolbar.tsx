import { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSearch } from "@fortawesome/free-solid-svg-icons"

type AdminToolbarProps = {
  children: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  className?: string
}

export function AdminToolbar({ 
  children, 
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  className 
}: AdminToolbarProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className || ""}`}>
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  )
}

