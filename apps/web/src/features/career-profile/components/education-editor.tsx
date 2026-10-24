import { CareerProfileField as Field } from "@/features/career-profile/components/career-profile-field";

export function EducationEditor({ index }: { index: number }) {
  const name = `educations.${index}` as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="md:col-span-2">
        <Field
          label="Institution name"
          name={`${name}.institutionName`}
          placeholder="University of the Philippines"
          required
        />
      </div>
      <Field
        label="Location"
        name={`${name}.location`}
        variant="location"
        placeholder="Quezon City, Philippines"
        required
      />
      <Field
        label="Degree"
        name={`${name}.degree`}
        placeholder="Bachelor of Science"
        required
      />
      <Field
        label="Field of study"
        name={`${name}.fieldOfStudy`}
        placeholder="Computer Science"
        required
      />
      <Field
        label="Specialization"
        name={`${name}.specialization`}
        placeholder="Software Engineering"
        optional
      />
      <Field
        label="Start date"
        name={`${name}.startDate`}
        variant="date"
        type="month"
        required
      />
      <Field
        label="End date"
        name={`${name}.endDate`}
        variant="date"
        type="month"
        required
      />
    </div>
  );
}
