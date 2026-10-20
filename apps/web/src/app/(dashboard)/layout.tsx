import { AppSidebar } from "@/components/shared/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      {/* Keep the A4 preview inside the page instead of stretching the dashboard. */}
      <SidebarInset className="min-h-0 min-w-0 p-8 md:pl-0">
        <Card className="min-h-0 min-w-0 flex-1">
          <CardContent className="min-h-0 overflow-y-auto p-0 has-data-dragging:overflow-x-hidden has-[[data-dragging=lock]]:overflow-hidden has-data-scroll-gutter:scrollbar-gutter-stable">
            {children}
          </CardContent>
        </Card>
      </SidebarInset>
    </SidebarProvider>
  );
}
