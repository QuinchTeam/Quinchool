"use client";

import { CameraIcon } from "@phosphor-icons/react/dist/ssr/Camera";
import Image from "next/image";
import { useRef } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppIcon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  AVATAR_ACCEPT,
  useAvatarUpload,
} from "@/features/profile/hooks/use-avatar-upload";
import { initialsOf } from "@/lib/utils";

export function AvatarUploader({
  image,
  name,
  onUploaded,
}: {
  image: string | null | undefined;
  name: string;
  onUploaded: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useAvatarUpload(() => {
    onUploaded();
    toast.success("Profile picture updated");
  });

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      disabled={upload.isPending}
      aria-label="Change profile picture"
      className="group relative shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Avatar size="lg" className="size-16">
        {image && (
          <AvatarImage
            render={
              <Image src={image} alt="" width={64} height={64} unoptimized />
            }
          />
        )}
        <AvatarFallback className="text-lg">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground transition-transform group-hover:scale-110">
        {upload.isPending ? (
          <Spinner className="size-3.5" />
        ) : (
          <AppIcon icon={CameraIcon} className="size-3.5" />
        )}
      </span>
      <input
        ref={input}
        type="file"
        accept={AVATAR_ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file again still fires onChange.
          event.target.value = "";
          if (!file) return;
          upload.mutate(file, {
            onError: (error) => toast.error(error.message),
          });
        }}
      />
    </button>
  );
}
