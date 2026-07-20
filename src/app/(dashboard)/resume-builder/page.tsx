"use client";

import { useState } from "react";

import { TextModelSelector } from "@/components/text-model-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

interface ResumeExperience {
  companyName: string;
  experience: string;
  id: string;
}

export default function ResumeBuilderPage() {
  const [companyName, setCompanyName] = useState("");
  const [experience, setExperience] = useState("");
  const [experiences, setExperiences] = useState<ResumeExperience[]>([]);
  const [modelId, setModelId] = useState<TextGenerationModelId>(
    DEFAULT_TEXT_GENERATION_MODEL_ID,
  );

  function addExperience(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyName.trim() || !experience.trim()) {
      return;
    }

    setExperiences((currentExperiences) => [
      ...currentExperiences,
      {
        companyName: companyName.trim(),
        experience: experience.trim(),
        id: crypto.randomUUID(),
      },
    ]);
    setCompanyName("");
    setExperience("");
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
            <Textarea id="job-requirements" />
          </div>
          <Button type="button">Build Resume</Button>
          <div className="min-h-32 rounded-md border bg-muted/30 p-4" />
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
          <Button type="submit">Add Experience</Button>
        </form>
      </section>
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Experiences</h2>
        {experiences.length ? (
          <div className="grid gap-3">
            {experiences.map((resumeExperience) => (
              <div key={resumeExperience.id} className="rounded-md border p-4">
                <p className="font-medium">{resumeExperience.companyName}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {resumeExperience.experience}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No experiences yet.
          </div>
        )}
      </section>
    </div>
  );
}
