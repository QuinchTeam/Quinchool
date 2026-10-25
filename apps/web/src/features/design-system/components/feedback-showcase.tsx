import { DitherScene } from "@/features/dashboard/components/dither-scene";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { AppIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DitherLoader } from "@/components/ui/dither-loader";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { AuthDither } from "@/features/auth/components/auth-form-parts";
import { AUTH_SCENES, type AuthScene } from "@/features/auth/lib/auth-scenes";
import { ScanProgressShowcase } from "@/features/design-system/components/scan-progress-showcase";
import { ShowcaseSection } from "@/features/design-system/components/showcase-section";

export function FeedbackShowcase() {
  return (
    <>
      <ShowcaseSection
        id="dither"
        title="Dither Scene"
        description="Home greeting icon, one per time of day"
      >
        {(["morning", "afternoon", "evening", "night"] as const).map(
          (period) => (
            <div key={period} className="grid justify-items-center gap-2">
              <DitherScene period={period} />
              <span className="text-xs text-muted-foreground capitalize">
                {period}
              </span>
            </div>
          ),
        )}
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
        id="auth-dither"
        title="Auth Dither"
        description="Auth card header icon, one per auth page"
      >
        {(Object.keys(AUTH_SCENES) as AuthScene[]).map((scene) => (
          <div key={scene} className="grid justify-items-center gap-2">
            <AuthDither scene={scene} />
            <span className="text-xs text-muted-foreground capitalize">
              {scene}
            </span>
          </div>
        ))}
      </ShowcaseSection>

      <Separator />

      <ScanProgressShowcase />

      <Separator />

      <ShowcaseSection
        id="feedback"
        title="Feedback"
        description="Spinner, dither loader, skeleton, and empty states"
        className="flex-col items-start gap-6"
      >
        <div className="flex items-center gap-6">
          <Spinner className="size-6" />
          <DitherLoader />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        <Empty className="w-full border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppIcon icon={MagnifyingGlassIcon} />
            </EmptyMedia>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filter to find what you&apos;re
              looking for.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline">Clear filters</Button>
          </EmptyContent>
        </Empty>
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
        id="sidebar"
        title="Sidebar"
        className="flex-col items-stretch"
      >
        <SidebarProvider className="h-96 min-h-0 w-full overflow-hidden rounded-lg border">
          <Sidebar collapsible="none" className="border-r">
            <SidebarHeader>
              <div className="flex items-center gap-2 px-2 py-1">
                <AppIcon icon={HouseIcon} />
                <span className="font-heading text-sm font-medium">
                  Quinchool
                </span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive>
                        <AppIcon icon={HouseIcon} />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <AppIcon icon={BellIcon} />
                        <span>Notifications</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <AppIcon icon={GearIcon} />
                        <span>Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <AppIcon icon={UserIcon} />
                    <span>Account</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">
                Sidebar content area
              </span>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ShowcaseSection>
    </>
  );
}
