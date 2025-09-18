"use client";

import Link from 'next/link';
import Image from 'next/image';
    
import {
  links,
  contactDetails,
  socialMedia,
  footerBottomLinks,
  copyrightText,
} from '../data/footer';

const Footer = () => {
  return (
    <footer className="bg-custom-light py-8 md:py-12 px-6 sm:px-12 lg:px-20 relative overflow-hidden z-[-1]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and company info */}
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" className="flex items-center">
                  <div className="absolute h-68 w-75 ml-[-96px]">
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
          </div>
          
          {/* Quick Links */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-lg font-nunito font-semibold mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              {links.explore.map((link, index) => (
                <Link key={index} href={link.href} className="text-gray-700 font-nunito hover:text-green-800">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Contact Info */}
           <div className="flex flex-col items-center sm:items-start">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-custom-green flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-nunito">{contactDetails.email}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-custom-green flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-nunito">{contactDetails.mob}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-20 h-8 rounded-full bg-custom-green flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-700 font-nunito">{contactDetails.location}</span>
                  <span className="text-gray-700 font-nunito">{contactDetails.address}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Social Media Links */}
          <div className="flex lg:mt-12 flex-col items-center sm:items-start">
            <div className="flex space-x-3 lg:px-6 mb-4">
              {socialMedia.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-custom-green flex items-center justify-center text-white"
                >
                  <Image
                    src={social.icon}
                    alt={`${social.href} Logo`}
                    width={20}
                    height={20}
                    className="w-4 h-4 md:w-5 md:h-5"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer Bottom Section */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center border-t border-gray-200 pt-4 text-center md:text-left">
          <div className="flex flex-wrap justify-center md:justify-start space-x-4 mb-4 md:mb-0">
            {footerBottomLinks.map((link, index) => (
              <Link key={index} href={link.href} className="text-sm text-gray-700 hover:text-green-800">
                {link.label}
              </Link>
            ))}
          </div>
       <div className="text-sm text-gray-700">
          {copyrightText}
          <span className="block md:inline md:ml-2">
            Powered by{' '}
            <span 
              className="hover:text-green-800 hover:underline cursor-pointer"
            >
              Trekking Miles
            </span>
            </span>
            </div>
            </div>
      </div>    
    </footer>
  );
};

export default Footer;
