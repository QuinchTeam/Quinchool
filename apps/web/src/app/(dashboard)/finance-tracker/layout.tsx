/** Marks finance tracker pages so the dashboard card reserves scrollbar space. */
export default function FinanceTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-scroll-gutter>{children}</div>;
}
