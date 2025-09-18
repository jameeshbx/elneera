"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll function
  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    // Update browser URL with hash
    window.history.pushState(null, "", `/#${targetId}`);
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-4 md:px-8",
        isScrolled ? "bg-white shadow-sm" : "bg-transparent"
      )}
      data-cy="navbar"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo - Visible on both mobile and desktop */}
        <Link
          href="/"
          onClick={(e) => handleSmoothScroll(e, "home")}
          className="flex items-center z-20"
          data-cy="navbar-logo"
        >
          <div className="absolute h-68 w-75 mk-[-96px]">
            <Image
  src="/elneera-logo.png"
  alt="Trekking Miles"
  width={176}  // Original dimensions
  height={64}
  className="w-[300px] h-auto object-contain" // Tailwind CSS scaling
  priority
/>
          </div>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-20"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          data-cy="mobile-menu-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 mr-5">
          <Link
            href="/#about"
            onClick={(e) => handleSmoothScroll(e, "about")}
            className="text-dark-green hover:text-gray-900 font-Raleway font-medium text-lg cursor-pointer"
            data-cy="nav-about"
          >
            About
          </Link>
          <Link
            href="/#testimonial"
            onClick={(e) => handleSmoothScroll(e, "testimonial")}
            className="text-dark-green hover:text-gray-900 font-Raleway font-medium text-lg cursor-pointer"
            data-cy="nav-testimonial"
          >
            Testimonial
          </Link>
          {/* <a
            href="/#pricing"
            onClick={(e) => handleSmoothScroll(e, "pricing")}
            className="text-dark-green hover:text-gray-900 font-Raleway font-medium text-lg cursor-pointer"
            data-cy="nav-pricing"
          >
            Pricing
          </a> */}
          <Link
            href="/login"
            className="text-dark-green hover:text-gray-900 font-Raleway font-medium text-lg"
            data-cy="nav-login"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-dark-green text-white px-5 py-2 rounded-full font-medium hover:bg-gray-900 transition-colors font-Poppins"
            data-cy="nav-signup"
          >
            Sign up
          </Link>
        </nav>

        {/* Mobile Navigation - Fixed positioning to center it */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-10 flex items-center justify-center">
            <nav className="flex flex-col gap-6 items-center">
              <Link
                href="/#about"
                onClick={(e) => handleSmoothScroll(e, "about")}
                className="text-dark-green hover:text-gray-900 font-medium py-2 font-Raleway cursor-pointer"
                data-cy="mobile-nav-about"
              >
                About
              </Link>
              <Link
                href="/#testimonial"
                onClick={(e) => handleSmoothScroll(e, "testimonial")}
                className="text-dark-green hover:text-gray-900 font-medium py-2 font-Raleway cursor-pointer"
                data-cy="mobile-nav-testimonial"
              >
                Testimonial
              </Link>
              <Link
                href="/#pricing"
                onClick={(e) => handleSmoothScroll(e, "pricing")}
                className="text-dark-green hover:text-gray-900 font-medium py-2 font-Raleway cursor-pointer"
                data-cy="mobile-nav-pricing"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-dark-green px-6 py-2 font-medium hover:bg-gray-50 transition-colors w-40 text-center font-Raleway"
                data-cy="mobile-nav-login"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-dark-green text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition-colors w-40 text-center font-Poppins"
                data-cy="mobile-nav-signup"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign up
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
