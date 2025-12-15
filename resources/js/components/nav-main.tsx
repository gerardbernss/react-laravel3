import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ChevronRight } from 'lucide-react';
import { type NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const page = usePage();

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavMenuItem key={item.title} item={item} currentUrl={page.url} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavMenuItem({ item, currentUrl }: { item: NavItem; currentUrl: string }) {
  const [hovered, setHovered] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = typeof item.href === 'string' && currentUrl.startsWith(item.href);

  return (
    <SidebarMenuItem
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      {/* Parent Button */}
      <SidebarMenuButton
        asChild={!hasChildren}
        isActive={isActive}
        tooltip={{ children: item.title }}
      >
        {hasChildren ? (
          <div className="flex w-full items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className="w-5 h-5" />}
              <span>{item.title}</span>
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                hovered ? 'rotate-90' : ''
              }`}
            />
          </div>
        ) : (
          <Link href={item.href!} prefetch>
            {item.icon && <item.icon className="w-5 h-5" />}
            <span>{item.title}</span>
          </Link>
        )}
      </SidebarMenuButton>

      {/* ✅ Hover Dropdown with Icons */}
      {hasChildren && hovered && (
        <div className="ml-6 mt-1 space-y-1 border-l border-muted-foreground/20 pl-3">
          {item.children!.map((child) => (
            <SidebarMenuItem key={child.title}>
              <SidebarMenuButton
                asChild
                isActive={
                  typeof child.href === 'string' &&
                  currentUrl.startsWith(child.href)
                }
                tooltip={{ children: child.title }}
              >
                <Link
                  href={child.href!}
                  prefetch
                  className="flex items-center gap-2"
                >
                  {child.icon && (
                    <child.icon className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span>{child.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </div>
      )}
    </SidebarMenuItem>
  );
}
