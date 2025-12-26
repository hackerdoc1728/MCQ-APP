"use client"

import { X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ImageLightboxProps {
  imageUrl: string
  onClose: () => void
}

export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center">
        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleZoomOut()
            }}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleZoomIn()
            }}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Image Container */}
        <div className="overflow-auto max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Enlarged view"
            className="rounded-lg transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          />
        </div>
      </div>
    </div>
  )
}
