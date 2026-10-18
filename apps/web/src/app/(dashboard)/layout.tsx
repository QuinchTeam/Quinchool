import { AppSidebar } from "@/components/shared/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Fixed-height shell: pages scroll inside the card so it never runs past the viewport.
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      {/* min-w-0: wide content (the A4 resume) scrolls inside its page instead
          of stretching the shell past the viewport. */}
      <SidebarInset className="min-h-0 min-w-0 p-8 md:pl-0">
        <Card className="min-h-0 min-w-0 flex-1">
          {/* Pages own their padding; the panel only clips and scrolls them. */}
          <CardContent className="min-h-0 overflow-y-auto p-0 has-data-dragging:overflow-x-hidden has-[[data-dragging=lock]]:overflow-hidden has-data-scroll-gutter:scrollbar-gutter-stable">
            {children}
          </CardContent>
        </Card>
      </SidebarInset>
    </SidebarProvider>
  );
}
