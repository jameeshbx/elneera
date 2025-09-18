import React from 'react'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = "", count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
        />
      ))}
    </>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Profile Header Skeleton */}
      <div className="p-6 flex items-center justify-between relative h-[100px] rounded-[15px] border border-white/70 overflow-hidden shadow-[0_8px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4 relative z-10">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Profile Information Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32 col-span-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Account Information Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32 col-span-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Team Section Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company Information Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
