import type { ReactNode } from "react";

type SmartLinksLayoutProps = {
  children: ReactNode;
};

/**
 * Minimal layout for smart links pages (album smart links).
 * Returns just the children without any wrapper, header, or footer.
 * Smart links pages use their own SmartLinksAlbumHeader component with album colors.
 */
export function SmartLinksLayout({ children }: SmartLinksLayoutProps) {
  return <>{children}</>;
}
