"use client"

import { useEffect, useState } from "react"
import SmartLinksLanding from "@/features/smart-links/components/SmartLinksLanding"
import type { Album, AlbumLink } from "@/features/albums/types"
import type { SmartLink } from "@/features/smart-links/data"

type PhonePreviewProps = {
  album: Album | null
  links: AlbumLink[]
}

export function PhonePreview({ album, links }: PhonePreviewProps) {
  const [phoneColor, setPhoneColor] = useState<string>("#1f2937") // Default gray

  // Extract dominant color from cover image for phone frame
  useEffect(() => {
    const extractColorFromImage = async (imageUrl: string) => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = imageUrl
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Sample pixels from the image (top-left corner area)
        const imageData = ctx.getImageData(0, 0, Math.min(100, img.width), Math.min(100, img.height))
        const data = imageData.data

        // Calculate average color
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }

        if (count > 0) {
          r = Math.floor(r / count)
          g = Math.floor(g / count)
          b = Math.floor(b / count)
          
          // Darken the color for phone frame
          r = Math.floor(r * 0.3)
          g = Math.floor(g * 0.3)
          b = Math.floor(b * 0.3)
          
          setPhoneColor(`rgb(${r}, ${g}, ${b})`)
        }
      } catch (error) {
        console.error("Error extracting color from image:", error)
      }
    }

    if (album?.cover_image_url) {
      extractColorFromImage(album.cover_image_url)
    } else {
      setPhoneColor("#1f2937") // Reset to default
    }
  }, [album?.cover_image_url])

  if (!album) {
    return null
  }

  return (
    <div className="hidden lg:block lg:col-span-2">
      <div className="sticky top-6 flex justify-center" style={{ maxHeight: '600px', overflow: 'hidden' }}>
        <div className="relative" style={{transform: 'scale(0.6)', transformOrigin: 'top center', marginTop: '-20px' }}>
          {/* Phone Frame */}
          <div 
            className="relative shadow-2xl mx-auto"
            style={{ width: '430px', height: '932px' }}
          >
            <img 
              src="/phone.png" 
              alt="Phone frame" 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-30"
            />
            {/* Phone Screen */}
            <div className="relative z-10 mx-auto" style={{ 
              width: '390px', 
              height: '900px',
              marginTop: '20px',
              borderTopLeftRadius: '70px',
              borderTopRightRadius: '70px',
              borderBottomLeftRadius: '70px',
              borderBottomRightRadius: '70px',
              position: 'relative',
              overflow: 'hidden',
              clipPath: 'inset(0 round 70px)'
            }}>
              {/* Status Bar */}
              <div className="absolute top-16 left-0 right-0 h-8 bg-transparent z-20 flex items-center justify-between px-6 text-xs font-medium text-white">
                <span>10:24</span>
                <div className="flex items-center gap-1.5">
                  {/* Signal bars */}
                  <div className="flex gap-0.5 items-end">
                    <div className="w-1 h-1.5 bg-white rounded-full"></div>
                    <div className="w-1 h-2 bg-white rounded-full"></div>
                    <div className="w-1 h-2.5 bg-white rounded-full"></div>
                  </div>
                  {/* Wi-Fi icon */}
                  <svg className="w-4 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 16 12">
                    <path d="M2 9.5c1.5-1.5 3.5-2.5 6-2.5s4.5 1 6 2.5M4.5 7.5c1-1 2.5-1.5 3.5-1.5s2.5.5 3.5 1.5M7 10.5l1-1 1 1"/>
                  </svg>
                  {/* Battery */}
                  <div className="w-6 h-3 border border-white rounded-sm relative">
                    <div className="w-4 h-full bg-white rounded-sm m-0.5"></div>
                    <div className="absolute -right-0.5 top-0.5 w-0.5 h-2 bg-white rounded-r"></div>
                  </div>
                </div>
              </div>

              {/* Safari Browser Bar */}
              <div className="absolute top-24 left-0 right-0 h-12 bg-white/10 backdrop-blur-xl z-20 flex items-center justify-between px-3 border-b border-white/10">
                <div className="flex items-center gap-2 flex-1">
                  {/* Back/Forward buttons */}
                  <div className="flex items-center gap-1">
                    <button className="w-6 h-6 flex items-center justify-center opacity-50">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center opacity-50">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  {/* Address Bar */}
                  <div className="flex-1 bg-black/20 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-white text-xs font-medium">mihaipol.com</span>
                  </div>
                  {/* Share/More button */}
                  <button className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Screen Content */}
              <div className="absolute top-36 left-0 right-0 bottom-0 overflow-y-auto" style={{ zIndex: 1 }}>
                <div className="mobile-preview-wrapper">
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .mobile-preview-wrapper > div {
                        position: relative !important;
                        inset: 0 !important;
                        height: auto !important;
                        min-height: 100% !important;
                        z-index: 1 !important;
                      }
                    `
                  }} />
                  <SmartLinksLanding
                    album={{
                      id: album.id,
                      title: album.title,
                      slug: album.slug,
                      artistName: null,
                      catalog_number: album.catalog_number || null,
                      coverImageUrl: album.cover_image_url || null,
                    }}
                    links={links.map((link): SmartLink => ({
                      id: link.id,
                      url: link.url,
                      platformName: link.platforms?.display_name || link.platforms?.name || 'Unknown',
                      platformIconUrl: null,
                      ctaLabel: link.cta_label || null,
                    }))}
                    showDebug={false}
                    disableTracking={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

