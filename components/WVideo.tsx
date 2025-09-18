"use client"

import { useRef, useState } from "react"
import { Play } from "lucide-react"
import Image from "next/image"

export default function SeeItInAction() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <section
      className="w-full py-8 sm:py-12 md:py-16 lg:py-24 overflow-hidden bg-white relative"
      data-test="see-it-in-action-section"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12">
          {/* Video Section - Order 2 on mobile, Order 1 on md+ */}
          <div
            className="w-full md:w-5/12 relative rounded-xl overflow-hidden shadow-xl order-2 md:order-1"
            data-test="video-container"
          >
            <div className="bg-gray-100 rounded-xl aspect-video relative overflow-hidden">
              {/* Dashboard mockup image that shows before video plays */}
              <Image
                src="/elneera-logo.png"
                width={800}
                height={600}
                alt="Dashboard preview"
                className="w-full h-full object-cover"
                style={{ display: isPlaying ? "none" : "block" }}
                data-test="video-thumbnail"
              />

              {/* Actual video element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ display: isPlaying ? "block" : "none" }}
                onEnded={() => setIsPlaying(false)}
                data-test="video-player"
              >
                <source src="/demo-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Play button overlay */}
              {!isPlaying && (
                <button
                  onClick={handlePlayClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                  aria-label="Play video"
                  data-test="play-button"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-primary fill-primary ml-1" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Text Content - Order 1 on mobile, Order 2 on md+ */}
          <div
            className="w-full md:w-5/12 text-center md:text-center mt-6 md:mt-0 order-1 md:order-2"
            data-test="content-container"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-Nunito font-bold leading-7 tracking-normal">
              See It in Action
            </h2>
            <p className="text-lg sm:text-xl md:text-xl text-gray-600 max-w-md mx-auto font-poppins font-medium leading-normal tracking-normal">
              Watch how our smart itinerary builder <br className="hidden sm:block" />
              simplifies travel planning in just a few <br className="hidden sm:block" />
              clicks
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
