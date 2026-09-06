"use client";

import {
  Add01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
  InboxIcon,
  Mail01Icon,
  Search01Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
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
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const FRUITS = ["Apple", "Banana", "Calamansi", "Durian", "Mango"];

const FRUIT_ITEMS = FRUITS.map((fruit) => ({ value: fruit, label: fruit }));

const INVOICES = [
  { id: "INV-001", status: "Paid", method: "Credit card", total: "PHP 2,500" },
  { id: "INV-002", status: "Pending", method: "GCash", total: "PHP 1,200" },
  {
    id: "INV-003",
    status: "Unpaid",
    method: "Bank transfer",
    total: "PHP 800",
  },
];

export function DesignGallery() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-12 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Design</h1>
        <p className="text-sm text-muted-foreground">
          Every component in <code>components/ui</code> at its default styling.
        </p>
      </header>

      <Section title="Button">
        <Row>
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </Row>
        <Row>
          {BUTTON_SIZES.map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
        </Row>
        <Row>
          <Button size="icon-xs">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
          <Button size="icon-sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
          <Button size="icon">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
          <Button size="icon-lg">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Spinner />
            Loading
          </Button>
        </Row>
      </Section>

      <Section title="Badge">
        <Row>
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </Row>
      </Section>

      <Section title="Avatar">
        <Row>
          <Avatar size="sm">
            <AvatarFallback>QS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>QS</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>QS</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>ON</AvatarFallback>
            <AvatarBadge />
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
        </Row>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>
              A short description of what this card holds.
            </CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Card content sits here.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Input, Label, Textarea">
        <FieldDemo />
      </Section>

      <Section title="Input group">
        <InputGroupDemo />
      </Section>

      <Section title="Checkbox">
        <CheckboxDemo />
      </Section>

      <Section title="Radio group">
        <RadioGroupDemo />
      </Section>

      <Section title="Select">
        <SelectDemo />
      </Section>

      <Section title="Combobox">
        <ComboboxDemo />
      </Section>

      <Section title="Toggle">
        <Row>
          <Toggle>
            <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
          </Toggle>
          <Toggle variant="outline">
            <HugeiconsIcon icon={TextItalicIcon} strokeWidth={2} />
          </Toggle>
          <Toggle size="sm">Small</Toggle>
          <Toggle size="lg">Large</Toggle>
          <Toggle disabled>Disabled</Toggle>
        </Row>
      </Section>

      <Section title="Toggle group">
        <Row>
          <ToggleGroup>
            <ToggleGroupItem value="bold">
              <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic">
              <HugeiconsIcon icon={TextItalicIcon} strokeWidth={2} />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline">
              <HugeiconsIcon icon={TextUnderlineIcon} strokeWidth={2} />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup variant="outline" spacing={0}>
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </Row>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel</TabsContent>
          <TabsContent value="activity">Activity panel</TabsContent>
          <TabsContent value="settings">Settings panel</TabsContent>
        </Tabs>
        <Tabs defaultValue="one">
          <TabsList variant="line">
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Line variant, panel one</TabsContent>
          <TabsContent value="two">Line variant, panel two</TabsContent>
        </Tabs>
      </Section>

      <Section title="Dropdown menu">
        <DropdownMenuDemo />
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            Open dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>
                A dialog description explaining the decision to make.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <DialogClose render={<Button />}>Confirm</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Sheet">
        <Row>
          {(["right", "left", "top", "bottom"] as const).map((side) => (
            <Sheet key={side}>
              <SheetTrigger render={<Button variant="outline" />}>
                {side}
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle>Sheet title</SheetTitle>
                  <SheetDescription>
                    A sheet opening from the {side}.
                  </SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <SheetClose render={<Button variant="outline" />}>
                    Close
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </Row>
      </Section>

      <Section title="Popover">
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            Open popover
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Popover title</PopoverTitle>
              <PopoverDescription>
                Anchored content with a description.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </Section>

      <Section title="Tooltip">
        <TooltipProvider>
          <Row>
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" />}>
                Hover me
              </TooltipTrigger>
              <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
          </Row>
        </TooltipProvider>
      </Section>

      <Section title="Calendar">
        <CalendarDemo />
      </Section>

      <Section title="Table">
        <Table>
          <TableCaption>Recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.id}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>{invoice.method}</TableCell>
                <TableCell>{invoice.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell>PHP 4,500</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Section>

      <Section title="Pagination">
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

      <Section title="Empty">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Nothing here yet</EmptyTitle>
            <EmptyDescription>
              Records you create will show up in this list.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Create the first one</Button>
          </EmptyContent>
        </Empty>
      </Section>

      <Section title="Separator">
        <div className="flex flex-col gap-4">
          <span className="text-sm">Above</span>
          <Separator />
          <span className="text-sm">Below</span>
        </div>
        <div className="flex h-8 items-center gap-4">
          <span className="text-sm">Left</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Right</span>
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </Section>

      <Section title="Spinner">
        <Row>
          <Spinner />
        </Row>
      </Section>

      <Section title="Sonner">
        <Row>
          <Button variant="outline" onClick={() => toast("Event created")}>
            Default
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.success("Changes saved")}
          >
            Success
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error("Something went wrong")}
          >
            Error
          </Button>
        </Row>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function FieldDemo() {
  const prefix = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-email`}>Email</Label>
        <Input id={`${prefix}-email`} type="email" placeholder="you@mail.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-disabled`}>Disabled</Label>
        <Input id={`${prefix}-disabled`} disabled placeholder="Disabled" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-invalid`}>Invalid</Label>
        <Input id={`${prefix}-invalid`} aria-invalid defaultValue="Not valid" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-notes`}>Notes</Label>
        <Textarea id={`${prefix}-notes`} placeholder="Write something" />
      </div>
    </div>
  );
}

function InputGroupDemo() {
  return (
    <div className="grid gap-4">
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search" />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="quinchool.com" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Copy</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Leave a comment" />
        <InputGroupAddon align="block-end">
          <InputGroupButton>Send</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CheckboxDemo() {
  const prefix = useId();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id={`${prefix}-a`} />
        <Label htmlFor={`${prefix}-a`}>Unchecked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${prefix}-b`} defaultChecked />
        <Label htmlFor={`${prefix}-b`}>Checked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${prefix}-c`} indeterminate />
        <Label htmlFor={`${prefix}-c`}>Indeterminate</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${prefix}-d`} disabled />
        <Label htmlFor={`${prefix}-d`}>Disabled</Label>
      </div>
    </div>
  );
}

function RadioGroupDemo() {
  const prefix = useId();
  return (
    <RadioGroup defaultValue="daily">
      {["daily", "weekly", "never"].map((value) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem id={`${prefix}-${value}`} value={value} />
          <Label htmlFor={`${prefix}-${value}`}>{value}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function SelectDemo() {
  return (
    <Row>
      <Select items={FRUIT_ITEMS} defaultValue="Mango">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            {FRUITS.map((fruit) => (
              <SelectItem key={fruit} value={fruit}>
                {fruit}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Select items={FRUIT_ITEMS}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Small" />
        </SelectTrigger>
        <SelectContent>
          {FRUITS.map((fruit) => (
            <SelectItem key={fruit} value={fruit}>
              {fruit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={FRUIT_ITEMS} disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          {FRUITS.map((fruit) => (
            <SelectItem key={fruit} value={fruit}>
              {fruit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

function ComboboxDemo() {
  const [value, setValue] = useState("");
  return (
    <Combobox
      items={FRUITS}
      inputValue={value}
      onInputValueChange={setValue}
      value={value}
      onValueChange={(fruit) => {
        if (fruit) setValue(fruit);
      }}
    >
      <ComboboxInput placeholder="Pick a fruit" autoComplete="off" />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found</ComboboxEmpty>
        <ComboboxList>
          {(fruit: string) => (
            <ComboboxItem key={fruit} value={fruit}>
              {fruit}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function DropdownMenuDemo() {
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("newest");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Open menu
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
            Inbox
            <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} />
            Tasks
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={checked}
          onCheckedChange={setChecked}
        >
          Show archived
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={radio}
          onValueChange={(next) => setRadio(String(next))}
        >
          <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Export</DropdownMenuItem>
            <DropdownMenuItem>Import</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <Calendar mode="single" selected={date} onSelect={setDate} />;
}
