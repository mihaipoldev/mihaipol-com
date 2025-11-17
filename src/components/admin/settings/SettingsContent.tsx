"use client"

import { motion } from "framer-motion"
import { AccountSettings } from "./AccountSettings"
import { AppearanceSettings } from "./AppearanceSettings"
import { PreferencesSettings } from "./PreferencesSettings"

type SettingsSection = "account" | "appearance" | "preferences"

interface SettingsContentProps {
  activeSection: SettingsSection
}

export function SettingsContent({ activeSection }: SettingsContentProps) {
  const getContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />
      case "appearance":
        return <AppearanceSettings />
      case "preferences":
        return <PreferencesSettings />
      default:
        return <AccountSettings />
    }
  }

  return (
    <motion.div
      key={activeSection}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.25, 
        ease: [0.4, 0, 0.2, 1] 
      }}
    >
      {getContent()}
    </motion.div>
  )
}

