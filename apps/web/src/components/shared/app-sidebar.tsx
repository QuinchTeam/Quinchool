"use client";

import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { NotepadIcon } from "@phosphor-icons/react/dist/ssr/Notepad";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { RobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr/UserCircle";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";
import { AppIcon, type AppIconProps } from "@/components/ui/icon";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth-client";
import { initialsOf } from "@/lib/utils";

// Route matches can differ from href when a nav item owns sibling pages.
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

// Home matches only itself; other items stay active on nested routes.
function isRouteActive(pathname: string, href: string, match?: string[]) {
  if (pathname === href) return true;

  return (match ?? [href]).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function UserAvatar({
  user,
  size,
  className,
}: {
  user?: { name?: string | null; image?: string | null };
  size?: "sm";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {user?.image && (
        <AvatarImage
          src={user.image}
          render={
            <Image
              src={user.image}
              alt={user.name ?? ""}
              width={40}
              height={40}
              // Avatars are served by our API; Next's optimizer has no remote host configured.
              unoptimized
            />
          }
        />
      )}
      <AvatarFallback>{initialsOf(user?.name ?? "")}</AvatarFallback>
    </Avatar>
  );
}

// Mobile top bar: logo on the left, Profile link and the menu that opens the nav sheet on the right.
export function AppSidebarMobile() {
  const { setOpenMobile } = useSidebar();
  const { data: session, isPending } = useSession();

  return (
    <header className="flex items-center justify-between gap-4 md:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <Image
          src="/quinchool-icon-v2.webp"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0"
        />
        <span className="truncate font-display text-lg font-bold uppercase">
          Quinchool
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="pl-2"
          nativeButton={false}
          render={<Link href="/profile" />}
        >
          {isPending ? (
            <Skeleton className="size-8 rounded-full" />
          ) : (
            <UserAvatar user={session?.user} size="sm" />
          )}
          Profile
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Open menu"
          onClick={() => setOpenMobile(true)}
        >
          <AppIcon icon={ListIcon} />
        </Button>
      </div>
    </header>
  );
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  // On mobile this renders as a sheet holding only the nav; AppSidebarMobile covers logo and profile.
  return (
    // The mobile sheet slides in from the right, next to the menu button that opens it.
    <Sidebar
      collapsible="icon"
      side={isMobile ? "right" : "left"}
      className="px-4 py-8"
    >
      {!isMobile && (
        <SidebarHeader className="flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
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
            <span className="truncate font-display text-lg font-bold uppercase">
              Quinchool
            </span>
          </div>
          <SidebarTrigger className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
      )}
      <SidebarContent className="max-md:rounded-lg max-md:bg-card max-md:p-2">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label ?? "main"}>
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
                    // Close the mobile sheet once a destination is picked.
                    onClick={() => setOpenMobile(false)}
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
      {!isMobile && (
        <SidebarFooter>
          {isPending ? (
            <div className="flex h-16 items-center gap-3 px-3">
              <Skeleton className="size-10 shrink-0 rounded-full group-data-[collapsible=icon]:size-8" />
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
                    // Base UI marks the trigger with data-popup-open; match the active nav link.
                    className="gap-3 group-data-[collapsible=icon]:justify-center data-popup-open:bg-secondary data-popup-open:text-secondary-foreground data-popup-open:hover:bg-secondary/80"
                  />
                }
              >
                <UserAvatar
                  user={user}
                  className="group-data-[collapsible=icon]:size-8"
                />
                <div className="flex flex-col overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm">{user?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem
                  className="h-12 text-muted-foreground"
                  render={<Link href="/profile" />}
                >
                  <AppIcon icon={UserCircleIcon} className="size-6" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-12 text-muted-foreground"
                  onClick={handleSignOut}
                >
                  <AppIcon icon={SignOutIcon} className="size-6" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarFooter>
      )}
      {isMobile && (
        // Mobile sheet: Profile and Sign out pinned at the bottom, styled like the nav links.
        <SidebarFooter className="p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isRouteActive(pathname, "/profile")}
                className="text-muted-foreground data-active:bg-secondary data-active:text-secondary-foreground data-active:hover:bg-secondary/80"
                render={<Link href="/profile" />}
                onClick={() => setOpenMobile(false)}
              >
                <AppIcon icon={UserCircleIcon} />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-muted-foreground"
                onClick={handleSignOut}
              >
                <AppIcon icon={SignOutIcon} />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
