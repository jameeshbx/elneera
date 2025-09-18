"use client"

import { X, ChevronRight } from "lucide-react"
import Image from "next/image"

interface NotificationItem {
  id: string
  avatar: string
  title: string
  description: string
  time: string
  unread: boolean
  link: string
}

interface NotificationsPopupProps {
  onClose: () => void
}

// Sample notification data
const notifications: NotificationItem[] = [
    {
        id: "1",
        avatar: "/avatar/avatar1.png?height=40&width=40",
        title: "Global DMC Solutions",
        description: "Alex Johnson : Price marked.",
        time: "0 min",
        unread: true,
        link: "#",
    },
    {
        id: "2",
        avatar: "/avatar/avatar2.png?height=40&width=40",
        title: "Holiday Planners",
        description: "Maria Lee : Itinerary received. Will update soon.",
        time: "6 min",
        unread: true,
        link: "#"
    },
    {
        id: "3",
        avatar: "/avatar/avatar3.png?height=40&width=40",
        title: "TravelEase",
        description: "Chris Martin : Okayy",
        time: "16 min",
        unread: false,
        link: "#",
    },
];

export function NotificationsPopup({ onClose }: NotificationsPopupProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg w-80 max-w-[95vw] overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 font-Raleway text-lg">Notifications</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close notifications">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>

      <div className="p-3 text-center bg-gray-50">
        <a href="#" className="text-lg text-custom-green hover:text-emerald-800 font-Raleway">
          Previous notifications
        </a>
      </div>
    </div>
  )
}

function NotificationItem({ notification }: { notification: NotificationItem }) {
  return (
    <a href={notification.link} className="flex items-center p-4 hover:bg-gray-50">
      <div className="relative flex-shrink-0">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
          <Image
            src={notification.avatar || "/placeholder.svg"}
            alt={notification.title}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
      </div>

      <div className="ml-3 flex-grow">
        <p className="font-medium text-lg font-Raleway">{notification.title}</p>
        <p className="text-xs text-gray-600 font-Raleway">{notification.description}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-Raleway">{notification.time}</p>
      </div>

      <div className="flex items-center gap-2">
        {notification.unread && <div className="h-2 w-2 rounded-full bg-red-500"></div>}
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </a>
  )
}
