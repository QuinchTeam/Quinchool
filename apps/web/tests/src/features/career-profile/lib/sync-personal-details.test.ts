import assert from "node:assert/strict";
import { test } from "node:test";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFormControl } from "react-hook-form";
import { emptyCareerProfile } from "../../../../../src/features/career-profile/lib/empty-career-profile.ts";
import { syncPersonalDetails } from "../../../../../src/features/career-profile/lib/sync-personal-details.ts";
import {
  type CareerProfileValues,
  careerProfileSchema,
} from "../../../../../src/features/career-profile/validations/career-profile.ts";

test("visible personal details replace stale state before the unchanged schema validates", async () => {
  const defaults = emptyCareerProfile();
  const form = createFormControl<CareerProfileValues>({
    defaultValues: defaults,
    resolver: zodResolver(careerProfileSchema),
  });
  let invalidFields: string[] = [];
  await form.handleSubmit(
    () => assert.fail("Empty personal details must be rejected"),
    (errors) => {
      invalidFields = Object.keys(errors);
    },
  )();
  assert.deepEqual(invalidFields.sort(), ["contactNumber", "email", "name"]);
  const data = new FormData();
  data.set("name", "Test Person");
  data.set("email", "person@example.com");
  data.set("contactNumber", "+1234567890");
  data.set("github", "https://ignored.example");
  syncPersonalDetails(data, form.setValue);
  let submitted: CareerProfileValues | undefined;
  await form.handleSubmit(
    (values) => {
      submitted = values;
    },
    () => assert.fail("Visible valid personal details must pass"),
  )();
  assert.equal(submitted?.name, "Test Person");
  assert.equal(submitted?.email, "person@example.com");
  assert.equal(submitted?.contactNumber, "+1234567890");
  assert.equal(submitted?.github, "", "Unrelated fields are untouched");
  data.set("email", "invalid-email");
  syncPersonalDetails(data, form.setValue);
  await form.handleSubmit(
    () => assert.fail("Invalid email must still be rejected"),
    (errors) => {
      assert.ok(errors.email);
    },
  )();
});

test("missing controls do not clear stored data; explicit empty inputs do", () => {
  const values: Record<string, string> = {
    name: "Existing",
    email: "existing@example.com",
  };
  const data = new FormData();
  data.set("name", "");
  syncPersonalDetails(data, (name, value) => {
    values[name] = value;
  });
  assert.equal(values.name, "");
  assert.equal(values.email, "existing@example.com");
});
