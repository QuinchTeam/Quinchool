"use client";

import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { NotepadIcon } from "@phosphor-icons/react/dist/ssr/Notepad";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { RobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";
import { AppIcon, type AppIconProps } from "@/components/ui/icon";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth-client";

/**
 * `match` is the route prefix that lights the item up, which is not always the
 * href: Resume links at a tab, and the random tools are siblings of their hub
 * rather than children of it.
 */
type NavItem = {
  href: string;
  icon: AppIconProps["icon"];
  label: string;
  match?: string[];
};

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/", icon: HouseIcon, label: "Home", match: [] },
      { href: "/chatbot", icon: RobotIcon, label: "Quinchbot" },
    ],
  },
  {
    label: "Work",
    items: [
      {
        href: "/resume/resume-tailor",
        icon: NotepadIcon,
        label: "Resume",
        match: ["/resume"],
      },
      {
        href: "/career-profile",
        icon: IdentificationCardIcon,
        label: "Career Profile",
      },
      { href: "/jobs-scraper", icon: BriefcaseIcon, label: "Jobs Scraper" },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        href: "/finance-tracker",
        icon: WalletIcon,
        label: "Finance Tracker",
      },
      {
        href: "/tools",
        icon: WrenchIcon,
        label: "All-Random Tools",
        match: ["/tools", "/text-generation", "/node-based-flow"],
      },
    ],
  },
];

/** True on the route itself and on anything nested under it, so a child page
 * keeps its parent lit. Home matches only itself, or it would match every
 * route. */
function isRouteActive(pathname: string, href: string, match?: string[]) {
  if (pathname === href) return true;

  return (match ?? [href]).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center justify-between border-b border-sidebar-border group-data-[collapsible=icon]:justify-center">
        <div className="relative hidden size-12 shrink-0 items-center justify-center group-data-[collapsible=icon]:flex">
          <Image
            src="/quinchool-icon-v2.webp"
            alt=""
            width={32}
            height={32}
            className="size-8 transition-opacity group-hover:opacity-0"
          />
          <SidebarTrigger className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" />
        </div>
        <div className="flex min-w-0 items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
          <Image
            src="/quinchool-icon-v2.webp"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0"
          />
          <span className="truncate font-display text-2xl font-bold">
            Quinchool
          </span>
        </div>
        <SidebarTrigger className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group, groupIndex) => (
          <SidebarGroup
            key={group.label ?? "main"}
            className={
              groupIndex === 0 ? undefined : "border-t border-sidebar-border"
            }
          >
            {group.label && (
              <SidebarGroupLabel className="h-6 uppercase tracking-wider text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isRouteActive(pathname, item.href, item.match)}
                    className="text-muted-foreground data-active:bg-secondary data-active:text-secondary-foreground data-active:hover:bg-secondary/80"
                    render={<Link href={item.href} />}
                  >
                    <AppIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {isPending ? (
          <div className="flex h-16 items-center gap-2 px-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="group-data-[collapsible=icon]:justify-center"
                />
              }
            >
              <Avatar size="sm">
                {user?.image && (
                  <AvatarImage
                    render={
                      <Image
                        src={user.image}
                        alt={user.name ?? ""}
                        width={24}
                        height={24}
                      />
                    }
                  />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-56">
              <DropdownMenuItem render={<Link href="/profile" />}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
