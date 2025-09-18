"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";

type MenuItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  isDropdown?: boolean;
  dropdownItems?: {
    name: string;
    href: string;
    logo: React.ReactNode;
  }[];
};

type SidebarProps = {
  expanded?: boolean;
  setExpanded?: (value: boolean) => void;
};

const Sidebar = ({ expanded }: SidebarProps) => {
  const pathname = usePathname();
  const [loginRequestsOpen, setLoginRequestsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleLoginRequests = () => {
    setLoginRequestsOpen(!loginRequestsOpen);
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/admin/daboard",
      icon: (
        <Image
          src="/dash.svg"
          alt="Dashboard"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
    },
    {
      title: "Login requests",
      href: "/admin/login-requests",
      icon: (
        <Image
          src="/login.svg"
          alt="Login Requests"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
      isDropdown: true,
      dropdownItems: [
        {
          name: "DMC",
          href: "/admin/login-requests/dmc",
          logo: (
            <Image
              src="/dmcagency.svg"
              alt="DMC Agency Logo"
              width={16}
              height={16}
              className="mr-2 min-w-[16px]"
            />
          ),
        },
        {
          name: "Other Agency",
          href: "/admin/login-requests/other",
          logo: (
            <Image
              src="/dmcagency.svg"
              alt="Agency Logo"
              width={16}
              height={16}
              className="mr-2 min-w-[16px]"
            />
          ),
        },
      ],
    },
    {
      title: "Subscription Details",
      href: "/admin/advisors",
      icon: (
        <Image
          src="/subscription.svg"
          alt="Advisors"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
    },
    {
      title: "Manage Users",
      href: "/admin/users",
      icon: (
        <Image
          src="/manage.svg"
          alt="Manage Users"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
    },
    {
      title: "Add DMC",
      href: "/admin/dashboard/add-dmc",
      icon: (
        <Image
          src="/Vector.svg"
          alt="Manage Users"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
    },
  ];

  const accountItems = [
    {
      title: "Profile",
      href: "/admin/dashboard/profile",
      icon: (
        <Image
          src="/profile.svg"
          alt="Profile"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: (
        <Image
          src="/settings.svg"
          alt="Settings"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
    },
    {
      title: "Logout",
      href: "#",
      icon: (
        <Image
          src="/logout.svg"
          alt="Logout"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ];

  // On mobile, we always want collapsed state
  const isCollapsed = isMobile ? true : !expanded;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 h-full bg-white shadow-lg transition-all duration-300 ${
        isMobile ? "w-16" : expanded ? "w-64" : "w-20"
      }`}
      data-cy="sidebar"
    >
      <div className="flex flex-col h-full p-2 md:p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Logo Section */}
        <div className="flex items-center justify-center p-2 mb-4">
          <Link href="/" data-cy="sidebar-logo-link">
            {isMobile ? (
              <Image
                src="/elneera-logo.png"
                alt="Company Logo"
                width={64}
                height={64}
                priority
                className="mx-auto"
                data-cy="sidebar-logo"
              />
            ) : isCollapsed ? (
              <Image
                src="/elneera-logo.png"
                alt="Company Logo"
                width={480}
                height={80}
                priority
                className="mx-auto"
                data-cy="sidebar-logo"
              />
            ) : (
              <Image
                src="/elneera-logo.png"
                alt="Company Logo"
                width={420}
                height={60}
                className="-mb-22 mt-[-61px] w-[320px]"
                priority
                data-cy="sidebar-logo"
              />
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <div key={item.href}>
              {item.isDropdown ? (
                <div className="relative">
                  <button
                    onClick={toggleLoginRequests}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center w-full p-2 md:p-3 rounded-lg transition-colors ${
                      pathname.startsWith("/admin/login-requests")
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    data-cy={`sidebar-item-${item.title
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="text-sm md:text-lg">{item.title}</span>
                        <svg
                          className={`w-4 h-4 ml-auto transition-transform ${
                            loginRequestsOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                  {loginRequestsOpen && !isCollapsed && (
                    <div className="ml-6 md:ml-8 mt-1 space-y-1">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className={`flex items-center px-3 py-1 md:px-4 md:py-2 text-sm md:text-xl rounded-lg ${
                            pathname === dropdownItem.href
                              ? "bg-blue-100 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy={`sidebar-dropdown-item-${dropdownItem.name
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
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
                  className={`flex items-center p-2 md:p-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  data-cy={`sidebar-item-${item.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-sm md:text-lg">{item.title}</span>
                  )}
                  {(isMobile || isCollapsed) && hoveredItem === item.title && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs md:text-sm rounded whitespace-nowrap">
                      {item.title}
                    </div>
                  )}
                </Link>
              )}
            </div>
          ))}

          <div className="pt-2 md:pt-4 mt-2 md:mt-4 border-t border-gray-200">
            {!isCollapsed && (
              <h3 className="px-2 md:px-3 mb-1 md:mb-2 text-xs font-semibold tracking-wider text-black uppercase">
                ACCOUNT PAGES
              </h3>
            )}
            {accountItems.map((item) =>
              item.title === "Logout" ? (
                <button
                  key={item.href}
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`flex items-center w-full p-2 md:p-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100`}
                  data-cy={`sidebar-account-item-${item.title.toLowerCase()}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-sm md:text-lg font-poppins">
                      {item.title}
                    </span>
                  )}
                  {(isMobile || isCollapsed) && hoveredItem === item.title && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs md:text-sm rounded whitespace-nowrap">
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
                  className={`flex items-center p-2 md:p-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  data-cy={`sidebar-account-item-${item.title.toLowerCase()}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-sm md:text-lg font-poppins">
                      {item.title}
                    </span>
                  )}
                  {(isMobile || isCollapsed) && hoveredItem === item.title && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs md:text-sm rounded whitespace-nowrap">
                      {item.title}
                    </div>
                  )}
                </Link>
              )
            )}
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
