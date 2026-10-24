import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { AppIcon } from "@/components/ui/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ShowcaseSection } from "@/features/design-system/components/showcase-section";

export function BasicsShowcase() {
  return (
    <>
      <ShowcaseSection
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
          <AppIcon icon={PlusIcon} />
        </Button>
        <Button disabled>
          <Spinner />
          Loading
        </Button>
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
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
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
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
      </ShowcaseSection>
    </>
  );
}
