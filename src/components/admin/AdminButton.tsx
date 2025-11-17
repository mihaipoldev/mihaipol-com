import * as React from "react"
import { ShadowButton } from "@/components/admin/ShadowButton"
import { ButtonProps } from "@/components/ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { cn } from "@/lib/utils"

type AdminButtonProps = ButtonProps & {
  icon?: IconDefinition
}

export function AdminButton({ 
  icon, 
  children, 
  className,
  ...props 
}: AdminButtonProps) {
  return (
    <ShadowButton className={cn("font-semibold", className)} {...props}>
      {icon && (
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      )}
      {children}
    </ShadowButton>
  )
}

