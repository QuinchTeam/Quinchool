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
    <SidebarProvider className="h-svh">
      <AppSidebar />
      <SidebarInset className="min-h-0 p-8 md:pl-0">
        <Card className="min-h-0 flex-1">
          {/* Pages own their padding; the panel only clips and scrolls them. */}
          <CardContent className="min-h-0 overflow-y-auto p-0 has-[[data-wallet-dragging=true]]:overflow-hidden has-data-scroll-gutter:scrollbar-gutter-stable">
            {children}
          </CardContent>
        </Card>
      </SidebarInset>
    </SidebarProvider>
  );
}
