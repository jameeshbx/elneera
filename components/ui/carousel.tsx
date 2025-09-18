'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  children: React.ReactNode[];
  itemsToShow?: number;
  className?: string;
}

export function Carousel({ children, itemsToShow = 3, className = '' }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const totalItems = React.Children.count(children);
  
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= totalItems - itemsToShow ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex <= 0 ? totalItems - itemsToShow : prevIndex - 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextSlide();
    }

    if (touchStart - touchEnd < -75) {
      prevSlide();
    }
  };

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
          width: `${(totalItems / itemsToShow) * 100}%`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {React.Children.map(children, (child, index) => (
          <div 
            key={index} 
            className="flex-shrink-0"
            style={{ width: `${100 / itemsToShow}%` }}
          >
            {child}
          </div>
        ))}
      </div>
      
      <button 
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      
      {/* Dots indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: Math.ceil(totalItems / itemsToShow) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index * itemsToShow)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentIndex >= index * itemsToShow && currentIndex < (index + 1) * itemsToShow
                ? 'bg-blue-600 w-6'
                : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
