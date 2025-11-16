import { notFound } from 'next/navigation'
import { getAlbumWithLinksBySlug } from '@/features/albums/data'
import TrackView from '@/components/analytics/TrackView'
import LinksLogger from '@/components/dev/LinksLogger'
import TrackedLink from '@/components/dev/TrackedLink'
import React from 'react'

export const dynamic = 'force-dynamic'

interface AlbumDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { slug } = await params
  const data = await getAlbumWithLinksBySlug(slug)

  if (!data) {
    notFound()
  }

  const { album, links } = data

  // Get first letter of title for placeholder
  const titleInitial = album.title ? album.title.charAt(0).toUpperCase() : 'A'

  const platformSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-blue-50 via-blue-100/50 to-slate-100 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-800">
      <TrackView eventType="page_view" entityType="album" entityId={album.id} metadata={{ album_slug: album.slug, path: `/dev/albums/${album.slug}` }} />
      <LinksLogger value={links} label="Album links" />
      {/* Full-screen gradient background */}
      <div className="min-h-screen">
        {/* Centered content container */}
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-md space-y-8">
            {/* Cover Art with Badge Overlay */}
            <div className="relative mx-auto w-full max-w-[360px]">
              {album.coverImageUrl ? (
                <div className="relative aspect-square rounded-2xl" style={{ filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))' }}>
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    <img
                      src={album.coverImageUrl}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square rounded-2xl" style={{ filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))' }}>
                  <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-6xl font-bold text-primary/60">{titleInitial}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title and Subtitle */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl">
                {album.artistName ? `${album.artistName} - ${album.title}` : album.title}
              </h1>
              {album.catalog_number && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {album.catalog_number}
                </p>
              )}
            </div>

            {/* Links Card */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-gray-800">
              {links.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No links available yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {links.map((link, index) => (
                    <TrackedLink
                      key={index}
                      href={link.url}
                      externalUrl={link.url}
                      entityId={link.id}
                      label={link.platformName}
                      rightLabel={link.ctaLabel || 'Play'}
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      debug={{ link }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
