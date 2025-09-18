"use client"

import Link from "next/link"
import type React from "react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { signOut } from "next-auth/react"

type MenuItem = {
  title: string
  href: string
  icon: React.ReactNode
  isDropdown?: boolean
  dropdownItems?: {
    name: string
    href: string
    logo?: React.ReactNode
  }[]
}

type SidebarProps = {
  expanded?: boolean
  setExpanded?: (value: boolean) => void
}

const Sidebar = ({ expanded }: SidebarProps) => {
  const pathname = usePathname()
  const [reportsOpen, setReportsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleReports = () => {
    setReportsOpen(!reportsOpen)
  }

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/agency/dashboard",
      icon: <Image src="/dash.svg" alt="Dashboard" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Enquiries",
      href: "/agency/dashboard/enquiry",
      icon: <Image src="/login.svg" alt="Enquiries" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Flights",
      href: "/agency/dashboard/flights", // Changed to direct route
      icon: <Image src="/flight.png" alt="Flights" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Accommodation",
      href: "/agency/dashboard/accomadation", // Changed to direct route
      icon: <Image src="/sleep.png" alt="Accommodation" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Reports",
      href: "/agency/dashboard/reports",
      icon: (
        <Image
          src="/subscription.svg"
          alt="Reports"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
      isDropdown: true,
      dropdownItems: [
        {
          name: "Bookings",
          href: "/agency/dashboard/reports/recent-booking",
          logo: <Image src="/dmcagency.svg" alt="Bookings" width={16} height={16} className="mr-2 min-w-[16px]" />,
        },
        {
          name: "Revenue by Destinations",
          href: "/agency/dashboard/reports/revenue-destination",
          logo: (
            <Image
              src="/dmcagency.svg"
              alt="Revenue by Destinations"
              width={16}
              height={16}
              className="mr-2 min-w-[16px]"
            />
          ),
        },
        {
          name: "Revenue by DMC",
          href: "/agency/dashboard/reports/revenue-dmc",
          logo: (
            <Image src="/dmcagency.svg" alt="Revenue by DMC" width={16} height={16} className="mr-2 min-w-[16px]" />
          ),
        },
      ],
    },
    {
      title: "Add Users", 
      href: "/agency-admin/dashboard/add-users",
      icon: (
        <Image
          src="/people.png"
          alt="Add Users"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
    },
    {
      title: "Add DMC",
      href: "/agency/dashboard/add-dmc",
      icon: <Image src="/Vector.svg" alt="Add DMC" width={20} height={20} className="min-w-[20px]" />,
    },
  ]

  const accountItems = [
    {
          title: "Lisa Ray",
          href: "/agency/dashboard/profile",
          icon: (
            <Image
              src= "/avatar/Image (3).png"
              alt="Profile"
              width={20}
              height={20}
              className="min-w-[20px]"
            />
          ),
        },
    {
      title: "Settings",
      href: "/agency/dashboard/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: "Logout",
      href: "#",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ),
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ]

  const isCollapsed = isMobile ? true : !expanded

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 h-full bg-white shadow-lg transition-all duration-300 ${
        isMobile ? "w-16" : expanded ? "w-64" : "w-16"
      }`}
      data-cy="sidebar"
    >
      <div className="flex flex-col h-full p-2 md:p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Logo Section */}
        <div className="flex items-center justify-center p-2 mb-6">
          <Link href="/" data-cy="sidebar-logo-link" className="flex items-center">
            {!isCollapsed ? (
              <Image
                src="/Alogo.png"
                alt="Company Logo"
                width={180}
                height={120}
                className="mb-2"
                priority
                data-cy="sidebar-logo"
              />
            ) : (
              <Image
                src="/Alogo.png"
                alt="Company Logo"
                width={40}
                height={40}
                priority
                className="mx-auto"
                data-cy="sidebar-logo"
              />
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <div key={item.href}>
              {item.isDropdown ? (
                <div className="relative">
                  <button
                    onClick={toggleReports}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center w-full ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors ${
                      pathname.startsWith("/agency/dashboard/reports")
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    data-cy={`sidebar-item-${item.title.toLowerCase().replace(/\s+/g, "-")} `}
                  >
                    <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="text-sm md:text-base font-medium">{item.title}</span>
                        <svg
                          className={`w-4 h-4 ml-auto transition-transform ${reportsOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {reportsOpen && !isCollapsed && (
                    <div className="ml-6 md:ml-8 mt-1 space-y-1">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className={`flex items-center px-3 py-2 text-sm rounded-lg ${
                            pathname === dropdownItem.href
                              ? "bg-blue-100 text-blue-600"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          data-cy={`sidebar-dropdown-item-${dropdownItem.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {dropdownItem.logo}
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`flex items-center ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors relative ${
                    pathname === item.href ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  data-cy={`sidebar-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                  {!isCollapsed && <span className="text-sm md:text-base font-medium">{item.title}</span>}
                  {(isMobile || isCollapsed) && hoveredItem === item.title && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </Link>
              )}
            </div>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-200">
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">ACCOUNT PAGES</h3>
            )}
            <div className="space-y-2">
              {accountItems.map((item) =>
                item.title === "Logout" ? (
                  <button
                    key={item.href}
                    onClick={item.onClick}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center w-full ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors text-gray-700 hover:bg-gray-100 relative}
                    data-cy={sidebar-account-item-${item.title.toLowerCase()}`}
                  >
                    <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                    {!isCollapsed && <span className="text-sm md:text-base font-medium">{item.title}</span>}
                    {(isMobile || isCollapsed) && hoveredItem === item.title && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                        {item.title}
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors relative ${
                      pathname === item.href ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    data-cy={`sidebar-account-item-${item.title.toLowerCase()}`}
                  >
                    <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                    {!isCollapsed && <span className="text-sm md:text-base font-medium">{item.title}</span>}
                    {(isMobile || isCollapsed) && hoveredItem === item.title && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                        {item.title}
                      </div>
                    )}
                  </Link>
                ),
              )}
            </div>
          </div>
        </nav>
 
        {!isCollapsed && (
          <div className="p-2 md:p-3 mt-auto">
            <Image
              src="/Background.svg"
              alt="background"
              width={218}
              height={250}
              className="w-full mt-4 md:mt-6"
            />
            <div className="p-2 md:p-3 bg-gray-50 rounded-lg mt-[-120px] md:mt-[-160px]">
              <Image
                src="/Icon.svg"
                alt="help icon"
                width={28}
                height={28}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <h4 className="mt-1 md:mt-2 mb-0 md:mb-1 text-xs md:text-[15px] text-white font-poppins">
                Need help?
              </h4>
              <p className="mb-1 md:mb-2 text-[11px] md:text-[13px] text-white font-poppins">
                Please check our docs
              </p>
              <button className="w-full px-2 py-1 md:px-3 md:py-2 text-xs md:text-[13px] text-center text-black font-poppins bg-white rounded-md hover:bg-gray-100">
                DOCUMENTATION
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;