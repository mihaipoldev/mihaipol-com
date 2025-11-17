import { notFound } from 'next/navigation'
import { getAlbumSmartLinksBySlug } from '@/features/smart-links'
import TrackView from '@/features/smart-links/analytics/components/TrackView'
import LinksLogger from '@/components/dev/LinksLogger'
import { SmartLinksLanding } from '@/features/smart-links'
import React from 'react'

export const dynamic = 'force-dynamic'

interface AlbumDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { slug } = await params
  const data = await getAlbumSmartLinksBySlug(slug)

  if (!data) {
    notFound()
  }

  const { album, links } = data
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-blue-50 via-blue-100/50 to-slate-100 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-800">
      <TrackView eventType="page_view" entityType="album" entityId={album.id} metadata={{ album_slug: album.slug, path: `/dev/albums/${album.slug}` }} />
      <LinksLogger value={links} label="Album links" />
      <SmartLinksLanding album={album} links={links} />
    </div>
  )
}
