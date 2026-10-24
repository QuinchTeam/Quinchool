import {
  CareerProfileField as Field,
  SkillsField,
} from "@/features/career-profile/components/career-profile-field";

export function SkillGroupEditor({ index }: { index: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field
        label="Label"
        name={`skillGroups.${index}.label`}
        placeholder="Frontend"
        required
      />
      <div className="md:col-span-2">
        <SkillsField
          ariaLabel={`Skills for group ${index + 1}`}
          name={`skillGroups.${index}.skills`}
          placeholder="Add a skill, then press Enter"
        />
      </div>
    </div>
  );
}
