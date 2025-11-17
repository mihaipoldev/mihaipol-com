import type { ReactNode } from "react";

type AlbumSlugLayoutProps = {
  children: ReactNode;
};

// This layout bypasses the dev layout's navbar/footer for standalone landing page
export default function AlbumSlugLayout({ children }: AlbumSlugLayoutProps) {
  return <>{children}</>;
}
