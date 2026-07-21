"use client";

import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { TextModelSelector } from "@/components/text-model-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResumeBullet } from "@/hooks/use-resume-builder";
import { useResumeBuilder } from "@/hooks/use-resume-builder";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

export default function ResumeBuilderPage() {
  const [companyName, setCompanyName] = useState("");
  const [experience, setExperience] = useState("");
  const [jobRequirement, setJobRequirement] = useState("");
  const [modelId, setModelId] = useState<TextGenerationModelId>(
    DEFAULT_TEXT_GENERATION_MODEL_ID,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [bulletToDelete, setBulletToDelete] = useState<ResumeBullet | null>(
    null,
  );
  const {
    resumeBullets,
    isLoading,
    saveResumeBullet,
    updateResumeBullet,
    deleteResumeBullet,
    buildResume,
  } = useResumeBuilder();

  function startEditing(resumeBullet: ResumeBullet) {
    setEditingId(resumeBullet.id);
    setEditCompanyName(resumeBullet.companyName);
    setEditExperience(resumeBullet.experience);
  }

  function saveEditing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId || !editCompanyName.trim() || !editExperience.trim()) {
      return;
    }

    updateResumeBullet.mutate(
      {
        id: editingId,
        companyName: editCompanyName.trim(),
        experience: editExperience.trim(),
      },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function confirmDelete() {
    if (!bulletToDelete) {
      return;
    }

    deleteResumeBullet.mutate(bulletToDelete.id, {
      onSuccess: () => setBulletToDelete(null),
    });
  }

  function addExperience(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyName.trim() || !experience.trim()) {
      return;
    }

    saveResumeBullet.mutate(
      { companyName: companyName.trim(), experience: experience.trim() },
      {
        onSuccess: () => {
          setCompanyName("");
          setExperience("");
        },
      },
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold">Resume Builder</h1>
      <Card>
        <CardHeader>
          <CardTitle>Build Resume</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextModelSelector
            label="Model"
            value={modelId}
            onValueChange={setModelId}
          />
          <div className="grid gap-2">
            <Label htmlFor="job-requirements">Job Requirements</Label>
            <Textarea
              id="job-requirements"
              value={jobRequirement}
              onChange={(event) => setJobRequirement(event.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={!jobRequirement.trim() || buildResume.isPending}
            onClick={() =>
              buildResume.mutate({
                jobRequirement: jobRequirement.trim(),
                modelId,
              })
            }
          >
            {buildResume.isPending ? "Building..." : "Build Resume"}
          </Button>
          <div className="min-h-32 whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
            {buildResume.isError
              ? "Failed to build resume. Try again."
              : buildResume.data?.text}
          </div>
        </CardContent>
      </Card>
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Add Experience</h2>
        <form onSubmit={addExperience} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="experience">Experience</Label>
            <Textarea
              id="experience"
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={saveResumeBullet.isPending}>
            {saveResumeBullet.isPending ? "Adding..." : "Add Experience"}
          </Button>
        </form>
      </section>
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Experiences</h2>
        {isLoading ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Loading experiences...
          </div>
        ) : resumeBullets.length ? (
          <div className="grid gap-3">
            {resumeBullets.map((resumeBullet) =>
              editingId === resumeBullet.id ? (
                <form
                  key={resumeBullet.id}
                  onSubmit={saveEditing}
                  className="grid gap-4 rounded-md border p-4"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="edit-company-name">Company Name</Label>
                    <Input
                      id="edit-company-name"
                      value={editCompanyName}
                      onChange={(event) =>
                        setEditCompanyName(event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-experience">Experience</Label>
                    <Textarea
                      id="edit-experience"
                      value={editExperience}
                      onChange={(event) =>
                        setEditExperience(event.target.value)
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateResumeBullet.isPending}
                    >
                      {updateResumeBullet.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div
                  key={resumeBullet.id}
                  className="flex items-start justify-between gap-4 rounded-md border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{resumeBullet.companyName}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {resumeBullet.experience}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startEditing(resumeBullet)}
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                      <span className="sr-only">
                        Edit experience for {resumeBullet.companyName}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setBulletToDelete(resumeBullet)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                      <span className="sr-only">
                        Delete experience for {resumeBullet.companyName}
                      </span>
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No experiences yet.
          </div>
        )}
      </section>
      <Dialog
        open={bulletToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBulletToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete experience?</DialogTitle>
            <DialogDescription>
              This permanently deletes the experience bullet for{" "}
              {bulletToDelete?.companyName}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            {bulletToDelete?.experience}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulletToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteResumeBullet.isPending}
              onClick={confirmDelete}
            >
              {deleteResumeBullet.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
