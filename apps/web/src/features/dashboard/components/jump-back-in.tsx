import { FileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import Link from "next/link";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyMedia } from "@/components/ui/empty";
import { AppIcon, type AppIconProps } from "@/components/ui/icon";

export function JumpBackIn() {
  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-medium">Jump back in</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Shortcut
          href="/resume/resume-tailor"
          icon={FileTextIcon}
          title="Tailor a resume"
          description="Match your profile against a job description."
        />
        <Shortcut
          href="/career-profile"
          icon={IdentificationCardIcon}
          title="Career profile"
          description="Keep your roles, projects, and skills current."
        />
        <Shortcut
          href="/finance-tracker"
          icon={WalletIcon}
          title="Log a transaction"
          description="Record income and expenses across wallets."
        />
      </div>
    </section>
  );
}

function Shortcut({
  description,
  href,
  icon,
  title,
}: {
  description: string;
  href: string;
  icon: AppIconProps["icon"];
  title: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors group-hover:bg-secondary">
        <CardContent className="flex items-start gap-4">
          <EmptyMedia variant="icon" className="mb-0">
            <AppIcon icon={icon} />
          </EmptyMedia>
          <div className="grid min-w-0 gap-1">
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
