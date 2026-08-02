"use client";

import {
  AiGenerativeIcon,
  ChatBotIcon,
  FilePenIcon,
  Home01Icon,
  WorkflowSquareIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut, useSession } from "@/lib/auth-client";

export function AppSidebar() {
  const router = useRouter();
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
      <SidebarHeader className="flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        <div className="relative hidden size-8 shrink-0 items-center justify-center group-data-[collapsible=icon]:flex">
          <span className="font-semibold transition-opacity group-hover:opacity-0">
            Q
          </span>
          <SidebarTrigger className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" />
        </div>
        <span className="truncate px-2 py-1 font-semibold group-data-[collapsible=icon]:hidden">
          Quinchool
        </span>
        <SidebarTrigger className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />}>
                <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/text-generation" />}>
                <HugeiconsIcon icon={AiGenerativeIcon} strokeWidth={2} />
                <span>Text Generation</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/chatbot" />}>
                <HugeiconsIcon icon={ChatBotIcon} strokeWidth={2} />
                <span>Chatbot</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/resume/resume-tailor" />}>
                <HugeiconsIcon icon={FilePenIcon} strokeWidth={2} />
                <span>Resume</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/node-based-flow" />}>
                <HugeiconsIcon icon={WorkflowSquareIcon} strokeWidth={2} />
                <span>Node Base Flow</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isPending ? (
          <div className="flex h-12 items-center gap-2 p-2">
            <Skeleton className="size-6 shrink-0 rounded-full" />
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
      <SidebarRail />
    </Sidebar>
  );
}
