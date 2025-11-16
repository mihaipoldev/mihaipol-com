"use client"

import { motion, AnimatePresence } from "framer-motion"
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
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1] 
        }}
      >
        {getContent()}
      </motion.div>
    </AnimatePresence>
  )
}

