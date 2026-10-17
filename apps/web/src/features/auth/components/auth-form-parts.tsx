import Link from "next/link";
import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AuthField<T extends FieldValues>({
  control,
  name,
  label,
  type,
  autoComplete,
  action,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: "email" | "password";
  autoComplete: string;
  action?: ReactNode;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {action ? (
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
              {action}
            </div>
          ) : (
            <FormLabel>{label}</FormLabel>
          )}
          <FormControl>
            <Input type={type} autoComplete={autoComplete} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="link"
      size="sm"
      nativeButton={false}
      className="px-0"
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}

export function AuthFooter({
  text,
  href,
  linkLabel,
}: {
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
      <span>{text}</span>
      <AuthLink href={href}>{linkLabel}</AuthLink>
    </div>
  );
}
