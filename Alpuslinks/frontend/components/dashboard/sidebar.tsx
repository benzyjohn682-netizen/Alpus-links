"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  ChevronLeft,
  Plus,
  Users,
  Shield,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { DefaultAvatar } from '@/components/ui/DefaultAvatar'
import { getRoleNameLowercase } from '@/lib/roleUtils'
import { apiService } from '@/lib/api'

type SidebarItem = {
  name: string
  icon: any
  href: string
  isAccordion?: boolean
  children?: SidebarItem[]
}

type SidebarSection = {
  name: string
  icon: any
  href: string | null
  children: SidebarItem[]
  isAccordion?: boolean
}

function getHomePathForRole(role?: any) {
  const roleName = getRoleNameLowercase(role)
  switch (roleName) {
    case 'super admin':
    case 'admin':
      return '/alpus-admin'
    case 'publisher':
      return '/publisher'
    case 'advertiser':
      return '/advertiser'
    case 'supportor':
      return '/supportor'
    default:
      return '/'
  }
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [hasWebsites, setHasWebsites] = useState(false)
  const [userWebsites, setUserWebsites] = useState<any[]>([])
  const { user } = useAuth()
  const pathname = usePathname()
  const role = getRoleNameLowercase(user?.role)

  // Check if user has websites
  const checkWebsites = async () => {
    if (user?.id && role === 'publisher') {
      try {
        const response = await apiService.getWebsites(user.id, 1, 10) // Get up to 10 websites
        if (response.data && (response.data as any).websites?.length > 0) {
          setHasWebsites(true)
          setUserWebsites((response.data as any).websites)
        } else {
          setHasWebsites(false)
          setUserWebsites([])
        }
      } catch (error) {
        console.error('Failed to check websites:', error)
        setHasWebsites(false)
        setUserWebsites([])
      }
    }
  }

  useEffect(() => {
    checkWebsites()
  }, [user?.id, role])

  // Listen for website creation events
  useEffect(() => {
    const handleWebsiteCreated = () => {
      checkWebsites()
    }

    // Listen for custom events
    window.addEventListener('websiteCreated', handleWebsiteCreated)
    window.addEventListener('websiteUpdated', handleWebsiteCreated)
    window.addEventListener('websiteDeleted', handleWebsiteCreated)

    return () => {
      window.removeEventListener('websiteCreated', handleWebsiteCreated)
      window.removeEventListener('websiteUpdated', handleWebsiteCreated)
      window.removeEventListener('websiteDeleted', handleWebsiteCreated)
    }
  }, [user?.id])

  const buildNavigation = (): Array<SidebarSection | { name: string; icon: any; href: string; children: [] }> => {
    const sections: Array<SidebarSection | { name: string; icon: any; href: string; children: [] }> = []

    // Dashboard item (except for supportor per requirements)
    if (role !== 'supportor') {
      sections.push({
        name: 'Dashboards',
        icon: LayoutDashboard,
        href: role === 'super admin' || role === 'admin' ? '/alpus-admin/dashboard'
          : role === 'publisher' ? '/publisher/dashboard'
          : role === 'advertiser' ? '/advertiser/dashboard'
          : '/dashboard',
        children: []
      })
    }

    // USER section
    const userChildren: SidebarItem[] = []
    // My Account: available to all
    userChildren.push({
      name: 'My Account',
      icon: User,
      href: role === 'super admin' || role === 'admin' ? '/alpus-admin/account'
        : role === 'publisher' ? '/publisher/account'
        : role === 'advertiser' ? '/advertiser/account'
        : '/supportor/account'
    })

    // My Websites: available to publishers
    if (role === 'publisher') {
      const myWebsitesChildren: SidebarItem[] = []
      
      // Add individual website domain pages if user has websites
      if (hasWebsites && userWebsites.length > 0) {
        userWebsites.forEach((website) => {
          const domain = website.domain || website.url?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'Unknown Domain'
          myWebsitesChildren.push({
            name: domain,
            icon: Plus,
            href: `/publisher/websites/${website._id}`
          })
        })
      }
      
      userChildren.push({
        name: 'My Websites',
        icon: BarChart3,
        href: '/publisher/websites',
        isAccordion: hasWebsites && myWebsitesChildren.length > 0,
        children: myWebsitesChildren
      })
    }

    // Available Websites: available to advertisers
    if (role === 'advertiser') {
      userChildren.push({
        name: 'Available Websites',
        icon: Globe,
        href: '/advertiser/websites'
      })
    }

    // Management options: only super admin/admin
    if (role === 'super admin' || role === 'admin') {
      userChildren.push({ 
        name: 'User Management', 
        icon: Users, 
        href: '/alpus-admin/users',
        isAccordion: true,
        children: [
          { name: 'Add User', icon: Plus, href: '/alpus-admin/users/add' },
          { name: 'All Users', icon: Users, href: '/alpus-admin/users/all' }
        ]
      })
      userChildren.push({ name: 'Role Management', icon: Shield, href: '/alpus-admin/roles' })
      userChildren.push({ name: 'Website Management', icon: BarChart3, href: '/alpus-admin/websites' })
      userChildren.push({ name: 'System Settings', icon: Settings, href: '/alpus-admin/settings' })
    }

    // For supportor, only show My Account (handled by conditional pushes above)
    if (userChildren.length > 0) {
      sections.push({ name: 'USER', icon: null, href: null, children: userChildren })
    }

    return sections
  }

  const navigation = buildNavigation()

  const isActive = (href: string) => {
    return pathname === href
  }

  const hasActiveChild = (children: any[]) => {
    return children.some(child => isActive(child.href))
  }

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }

  return (
    <div className={cn(
      "kt-sidebar",
      "bg-white dark:bg-gray-800",
      "border-r border-gray-200 dark:border-gray-700",
      "transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Header */}
      <div className="kt-sidebar__header p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                AlpusLinks
              </span>
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
              className="group p-2 rounded-full bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
            >
              <ChevronLeft className={cn(
                "w-5 h-5 text-gray-500 transition-transform duration-300",
                collapsed && "rotate-180"
              )} />
            </button>
            <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md text-xs bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
              {collapsed ? "Expand" : "Collapse"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="kt-sidebar__nav p-4 space-y-2">
        {navigation.map((item, index) => (
          <div key={index}>
            {item.children && item.children.length > 0 ? (
              <div>
                {!collapsed && (
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {item.name}
                  </div>
                )}
                <div className="space-y-1">
                  {item.children.map((child, childIndex) => {
                    const Icon = child.icon
                    const isChildActive = isActive(child.href)
                    const hasActiveChildItem = hasActiveChild(item.children || [])
                    const isExpanded = expandedSections.includes(child.name)
                    
                    // Handle accordion sections
                    if (child.isAccordion && child.children) {
                      return (
                        <div key={childIndex}>
                          <button
                            onClick={() => toggleSection(child.name)}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors",
                              "hover:bg-gray-100 dark:hover:bg-gray-700",
                              hasActiveChildItem && "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                              {!collapsed && (
                                <span className="text-sm font-medium">
                                  {child.name}
                                </span>
                              )}
                            </div>
                            {!collapsed && (
                              isExpanded ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          
                          {isExpanded && !collapsed && (
                            <div className="ml-4 space-y-1 mt-1">
                              {child.children?.map((subChild: any, subIndex: number) => {
                                const SubIcon = subChild.icon
                                const isSubActive = isActive(subChild.href)
                                
                                return (
                                  <Link
                                    key={subIndex}
                                    href={subChild.href}
                                    className={cn(
                                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                                      isSubActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    )}
                                  >
                                    {SubIcon && <SubIcon className="w-4 h-4 flex-shrink-0" />}
                                    <span className="text-sm font-medium">
                                      {subChild.name}
                                    </span>
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    // Regular menu items
                    return (
                      <Link
                        key={childIndex}
                        href={child.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          isChildActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                          hasActiveChildItem && !isChildActive && "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                        {!collapsed && (
                          <span className="text-sm font-medium">
                            {child.name}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <Link
                href={item.href || '#'}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  isActive(item.href || '') && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
              >
                {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.name}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="kt-sidebar__footer p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={user.avatar} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultAvatar className="w-full h-full" alt={`${user?.firstName} ${user?.lastName}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
