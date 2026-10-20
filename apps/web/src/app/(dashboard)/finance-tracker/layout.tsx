export default function FinanceTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-scroll-gutter>{children}</div>;
}
