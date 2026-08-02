import assert from "node:assert/strict";
import test from "node:test";
import { renderToBuffer } from "@react-pdf/renderer";

import { ResumePdfDocument } from "@/components/resume-builder/resume-pdf-document";

test("renders resume text and links instead of a page image", async () => {
  const buffer = await renderToBuffer(
    <ResumePdfDocument
      profile={{
        name: "Cyril James De Guzman",
        email: "cyril@example.com",
        contactNumber: "+63 900 000 0000",
        linkedin: "https://linkedin.com/in/quinchy",
        github: "https://github.com/quinchy",
        personalWebsite: "https://quinchy.dev",
        educations: [],
        experiences: [],
        projects: [],
        skillGroups: [{ label: "Frontend", skills: ["Next.js"] }],
      }}
    />,
  );
  const source = buffer.toString("latin1");

  assert.match(source, /^%PDF-/);
  assert.match(source, /\/Type \/Font/);
  assert.match(source, /\/Subtype \/Link/);
  assert.doesNotMatch(source, /\/Subtype \/Image/);
});
