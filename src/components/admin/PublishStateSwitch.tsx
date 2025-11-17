"use client"

import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type PublishStateSwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function PublishStateSwitch({
  checked,
  onCheckedChange,
}: PublishStateSwitchProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .publish-state-switch button[data-state="checked"] > span {
            transform: translateX(28px) !important;
          }
        `
      }} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="publish-state-switch [&>button]:h-7 [&>button]:w-14 [&>button]:px-0 [&>button>span]:h-6 [&>button>span]:w-6">
              <Switch checked={checked} onCheckedChange={onCheckedChange} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Publish State</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}

