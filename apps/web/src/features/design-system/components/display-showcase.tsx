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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
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
import { ShowcaseSection } from "@/features/design-system/components/showcase-section";

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

export function DisplayShowcase() {
  return (
    <>
      <ShowcaseSection
        id="tabs"
        title="Tabs"
        className="flex-col items-stretch"
      >
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
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
        id="card"
        title="Card"
        className="flex-col items-stretch"
      >
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
          <CardFooter>
            <Button variant="outline">Dismiss</Button>
            <Button>View</Button>
          </CardFooter>
        </Card>
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
        id="table"
        title="Table"
        className="flex-col items-stretch"
      >
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
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
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
      </ShowcaseSection>
    </>
  );
}
