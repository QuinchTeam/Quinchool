import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { DitherCanvas } from "@/components/shared/dither-canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { AUTH_SCENES, type AuthScene } from "@/features/auth/lib/auth-scenes";

// Carry the typed email to the next auth page, which reads it back as its default.
export function withEmail(path: string, email: string) {
  const trimmed = email.trim();
  return trimmed ? `${path}?email=${encodeURIComponent(trimmed)}` : path;
}

export function AuthDither({ scene }: { scene: AuthScene }) {
  return (
    <div className="size-20 shrink-0 rounded-lg border-2 border-primary/25 p-1">
      <div className="size-full overflow-hidden rounded-md bg-muted text-primary">
        <DitherCanvas scene={AUTH_SCENES[scene]} className="size-full" />
      </div>
    </div>
  );
}

export function AuthCard({
  title,
  description,
  scene,
  footer,
  children,
}: {
  title: string;
  description: string;
  scene: AuthScene;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <Image
          src="/quinchool-icon-v2.webp"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0"
        />
        <span className="font-display text-xl font-bold uppercase">
          Quinchool
        </span>
      </div>
      <Card className="w-full">
        <CardHeader className="flex items-center gap-4">
          <AuthDither scene={scene} />
          <div className="grid gap-0.5">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center">{footer}</CardFooter>
      </Card>
    </div>
  );
}

export function AuthField<T extends FieldValues>({
  control,
  name,
  label,
  type,
  autoComplete,
  placeholder,
  action,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: "email" | "password";
  autoComplete: string;
  placeholder: string;
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
            <Input
              variant={type}
              autoComplete={autoComplete}
              placeholder={placeholder}
              {...field}
            />
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
