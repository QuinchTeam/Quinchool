"use client";

import {
  Add01Icon,
  CreditCardIcon,
  Home09Icon,
  Logout03Icon,
  Notification03Icon,
  Search01Icon,
  Settings02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type * as React from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const sections = [
  { id: "buttons", label: "Button" },
  { id: "badges", label: "Badge" },
  { id: "avatars", label: "Avatar" },
  { id: "form", label: "Form" },
  { id: "toggles", label: "Toggle" },
  { id: "tabs", label: "Tabs" },
  { id: "card", label: "Card" },
  { id: "table", label: "Table" },
  { id: "pagination", label: "Pagination" },
  { id: "overlays", label: "Overlays" },
  { id: "toast", label: "Sonner" },
  { id: "feedback", label: "Feedback" },
  { id: "sidebar", label: "Sidebar" },
];

const invoices = [
  { id: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
  { id: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
  {
    id: "INV003",
    status: "Unpaid",
    method: "Bank Transfer",
    amount: "$350.00",
  },
  { id: "INV004", status: "Paid", method: "Credit Card", amount: "$450.00" },
] as const;

const invoiceStatusVariant = {
  Paid: "default",
  Pending: "secondary",
  Unpaid: "destructive",
} as const;

function Section({
  id,
  title,
  description,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-20">
      <div>
        <h2 className="font-heading text-lg font-medium">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn("flex flex-wrap items-center gap-4", className)}>
        {children}
      </div>
    </section>
  );
}

export default function DesignSystem() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 p-6 sm:p-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Design System</h1>
          <p className="text-sm text-muted-foreground">
            Every shadcn component installed in this project, in one place.
          </p>
        </div>
        <ModeToggle />
      </header>

      <nav className="flex flex-wrap gap-2">
        {sections.map((item) => (
          <Badge
            key={item.id}
            variant="outline"
            // biome-ignore lint/a11y/useAnchorContent: label is passed as Badge children and merged into the anchor via the render prop
            render={<a href={`#${item.id}`} />}
          >
            {item.label}
          </Badge>
        ))}
      </nav>

      <Separator />

      <Section
        id="buttons"
        title="Button"
        description="Variants, sizes, and states"
      >
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add item">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
        <Button disabled>
          <Spinner />
          Loading
        </Button>
      </Section>

      <Separator />

      <Section
        id="badges"
        title="Badge"
        description="Status and label variants"
      >
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="link">Link</Badge>
      </Section>

      <Separator />

      <Section
        id="avatars"
        title="Avatar"
        description="Single avatars and groups"
      >
        <Avatar size="sm">
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>B</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </Section>

      <Separator />

      <Section
        id="form"
        title="Form"
        description="Input, textarea, label, select, checkbox, and radio group"
        className="flex-col items-start gap-6"
      >
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" placeholder="Type your message here." />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="fruit">Favorite fruit</Label>
          <Select defaultValue="blueberry">
            <SelectTrigger id="fruit" className="w-full">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="terms" defaultChecked />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
        <RadioGroup defaultValue="comfortable" className="gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="default" id="r1" />
            <Label htmlFor="r1">Default</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="comfortable" id="r2" />
            <Label htmlFor="r2">Comfortable</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="compact" id="r3" />
            <Label htmlFor="r3">Compact</Label>
          </div>
        </RadioGroup>
      </Section>

      <Separator />

      <Section
        id="toggles"
        title="Toggle"
        description="Toggle, toggle group, and date picker"
      >
        <Toggle aria-label="Toggle bold">
          <span className="font-bold">B</span>
        </Toggle>
        <Toggle aria-label="Toggle italic" variant="outline">
          <span className="italic">I</span>
        </Toggle>
        <ToggleGroup defaultValue={["center"]}>
          <ToggleGroupItem value="left" aria-label="Align left">
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            Center
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            Right
          </ToggleGroupItem>
        </ToggleGroup>
        <DatePicker />
      </Section>

      <Separator />

      <Section id="tabs" title="Tabs" className="flex-col items-stretch">
        <Tabs defaultValue="account" className="w-full max-w-sm">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <p className="text-sm text-muted-foreground">
              Update your account details here.
            </p>
          </TabsContent>
          <TabsContent value="password">
            <p className="text-sm text-muted-foreground">
              Change your password here.
            </p>
          </TabsContent>
        </Tabs>
      </Section>

      <Separator />

      <Section id="card" title="Card" className="flex-col items-stretch">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>You have 3 unread messages.</CardDescription>
            <CardAction>
              <Badge variant="secondary">New</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage your notification preferences from the settings page.
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline">Dismiss</Button>
            <Button>View</Button>
          </CardFooter>
        </Card>
      </Section>

      <Separator />

      <Section id="table" title="Table" className="flex-col items-stretch">
        <Table>
          <TableCaption>A list of recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>
                  <Badge variant={invoiceStatusVariant[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>{invoice.method}</TableCell>
                <TableCell className="text-right">{invoice.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Separator />

      <Section
        id="pagination"
        title="Pagination"
        className="flex-col items-stretch"
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Section>

      <Separator />

      <Section
        id="overlays"
        title="Overlays"
        description="Dialog, sheet, popover, tooltip, and dropdown menu"
      >
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            Open Dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="dialog-name">Name</Label>
              <Input id="dialog-name" defaultValue="Cyril" />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            Open Sheet
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose render={<Button />}>Close</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            Open Popover
          </PopoverTrigger>
          <PopoverContent>
            <p className="text-sm text-muted-foreground">
              Place content for the popover here.
            </p>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            Hover me
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Open Menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Separator />

      <Section id="toast" title="Sonner" description="Toast notifications">
        <Button
          variant="outline"
          onClick={() =>
            toast("Event has been created", {
              description: "Sunday, June 14, 2026 at 9:00 AM",
              action: {
                label: "Undo",
                onClick: () => toast.dismiss(),
              },
            })
          }
        >
          Show Toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Saved successfully")}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Something went wrong")}
        >
          Error
        </Button>
      </Section>

      <Separator />

      <Section
        id="feedback"
        title="Feedback"
        description="Spinner, skeleton, and empty states"
        className="flex-col items-start gap-6"
      >
        <Spinner className="size-6" />

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
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
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
      </Section>

      <Separator />

      <Section id="sidebar" title="Sidebar" className="flex-col items-stretch">
        <SidebarProvider className="h-96 min-h-0 w-full overflow-hidden rounded-lg border">
          <Sidebar collapsible="none" className="border-r">
            <SidebarHeader>
              <div className="flex items-center gap-2 px-2 py-1">
                <HugeiconsIcon icon={Home09Icon} strokeWidth={2} />
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
                        <HugeiconsIcon icon={Home09Icon} strokeWidth={2} />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <HugeiconsIcon
                          icon={Notification03Icon}
                          strokeWidth={2}
                        />
                        <span>Notifications</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
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
                    <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
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
      </Section>
    </div>
  );
}
