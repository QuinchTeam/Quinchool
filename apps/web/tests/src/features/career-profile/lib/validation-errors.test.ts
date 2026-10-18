import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import {
  validationFieldLabel,
  validationFieldNames,
  validationMessages,
} from "../../../../../src/features/career-profile/lib/validation-errors.ts";

test("validation summary includes nested and array-root errors without reading DOM refs", () => {
  const ref: Record<string, unknown> = {};
  ref.self = ref;
  assert.deepEqual(
    validationMessages({
      email: { message: "Enter a valid email", ref },
      experiences: [{ endDate: { message: "Select a valid month" } }],
      skillGroups: { root: { message: "Too many groups" } },
    }),
    [
      "email: Enter a valid email",
      "experiences.0.endDate: Select a valid month",
      "skillGroups.root: Too many groups",
    ],
  );
  assert.deepEqual(validationMessages({}), []);
});

test("validation telemetry contains field paths, never values, messages or DOM refs", () => {
  assert.deepEqual(
    validationFieldNames({
      name: {
        message: "private profile value",
        ref: { value: "private input" },
      },
      experiences: [{ endDate: { message: "private exception detail" } }],
      "private-field-value": { message: "private" },
    }),
    ["name", "experiences.0.endDate"],
  );
});

test("validation labels read as words, with 1-based entry numbers", () => {
  assert.equal(validationFieldLabel("contactNumber"), "Contact number");
  assert.equal(validationFieldLabel("linkedin"), "LinkedIn");
  assert.equal(
    validationFieldLabel("experiences.0.endDate"),
    "Experience 1 › End date",
  );
  assert.equal(
    validationFieldLabel("projects.2.bullets.0"),
    "Project 3 › Bullet 1",
  );
  assert.equal(validationFieldLabel("skillGroups.root"), "Skill groups");
});
