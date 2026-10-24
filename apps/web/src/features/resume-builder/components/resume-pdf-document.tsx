import { Document, Link, Page, Text, View } from "@react-pdf/renderer";
import {
  displayUrl,
  formatDateRange,
  RESUME_CONTACT_FIELDS,
  type ResumeContactField,
  type ResumeProfile,
} from "@/features/resume-builder/lib/resume";
import { resumePdfStyles as styles } from "@/features/resume-builder/lib/resume-pdf-styles";

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletMark}>{"\u2022"}</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export function ResumePdfDocument({
  onRender,
  profile,
}: {
  onRender?: React.ComponentProps<typeof Document>["onRender"];
  profile: ResumeProfile;
}) {
  const links: Record<ResumeContactField, string> = {
    email: profile.email && `mailto:${profile.email}`,
    linkedin: profile.linkedin,
    personalWebsite: profile.personalWebsite,
    github: profile.github,
    contactNumber: profile.contactNumber && `tel:${profile.contactNumber}`,
  };
  const contacts = (profile.contactOrder ?? RESUME_CONTACT_FIELDS)
    .filter((field) => profile[field])
    .map((field) => ({
      label:
        field === "email" || field === "contactNumber"
          ? profile[field]
          : displayUrl(profile[field]),
      src: links[field],
    }));

  return (
    <Document
      author={profile.name}
      language="en"
      subject="Resume"
      title={`${profile.name} Resume`}
      onRender={onRender}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.contacts}>
            {contacts.map((contact, index) => (
              <View key={contact.src} style={styles.row}>
                {index > 0 && <Text style={styles.separator}>|</Text>}
                <Link
                  src={contact.src}
                  style={
                    contact.src.startsWith("tel:")
                      ? styles.phoneLink
                      : styles.link
                  }
                >
                  {contact.label}
                </Link>
              </View>
            ))}
          </View>
        </View>

        {profile.experiences.length > 0 && (
          <Section title="Experiences">
            {profile.experiences.map((experience, index) => (
              <View
                key={`${experience.companyName}-${experience.jobTitle}-${experience.startDate}`}
                minPresenceAhead={24}
                style={
                  index === profile.experiences.length - 1
                    ? styles.lastEntry
                    : styles.entry
                }
              >
                <View style={styles.row}>
                  <Text style={[styles.bold, styles.grow]}>
                    {experience.jobTitle}
                  </Text>
                  <Text style={[styles.bold, styles.right]}>
                    {formatDateRange(
                      experience.startDate,
                      experience.endDate,
                      experience.isCurrent,
                    )}
                  </Text>
                </View>
                <View style={[styles.row, styles.companyRow]}>
                  <Text style={[styles.italic, styles.grow]}>
                    {experience.companyName}
                    {experience.employmentType
                      ? ` | ${experience.employmentType}`
                      : ""}
                  </Text>
                  <Text style={[styles.italic, styles.right]}>
                    {experience.location}
                  </Text>
                </View>
                {experience.bullets.map((bullet) => (
                  <Bullet key={`${experience.companyName}-${bullet.text}`}>
                    {bullet.text}
                  </Bullet>
                ))}
              </View>
            ))}
          </Section>
        )}

        {profile.projects.length > 0 && (
          <Section title="Projects">
            {profile.projects.map((project, index) => (
              <View
                key={`${project.projectName}-${project.startDate}`}
                minPresenceAhead={24}
                style={
                  index === profile.projects.length - 1
                    ? styles.lastEntry
                    : styles.entry
                }
              >
                <View style={styles.row}>
                  <Text style={[styles.bold, styles.grow]}>
                    {project.projectName}
                  </Text>
                  <Text style={[styles.bold, styles.right]}>
                    {formatDateRange(
                      project.startDate,
                      project.endDate,
                      project.isCurrent,
                    )}
                  </Text>
                </View>
                {project.skills.length > 0 && (
                  <Text style={styles.italic}>{project.skills.join(", ")}</Text>
                )}
                {project.bullets.map((bullet) => (
                  <Bullet key={`${project.projectName}-${bullet.text}`}>
                    {bullet.text}
                  </Bullet>
                ))}
              </View>
            ))}
          </Section>
        )}

        {profile.skillGroups.length > 0 && (
          <Section title="Skills">
            {profile.skillGroups.map((group) => (
              <Text key={group.label} style={styles.skillLine}>
                <Text style={styles.bold}>{group.label}:</Text>{" "}
                {group.skills.join(", ")}
              </Text>
            ))}
          </Section>
        )}

        {profile.educations.length > 0 && (
          <Section title="Education">
            {profile.educations.map((education, index) => (
              <View
                key={`${education.institutionName}-${education.degree}-${education.startDate}`}
                minPresenceAhead={18}
                style={
                  index === profile.educations.length - 1
                    ? styles.lastEntry
                    : styles.education
                }
              >
                <View style={styles.row}>
                  <Text style={[styles.bold, styles.grow]}>
                    {education.degree} in {education.fieldOfStudy}
                    {education.specialization
                      ? `, ${education.specialization}`
                      : ""}
                  </Text>
                  <Text style={[styles.bold, styles.right]}>
                    {formatDateRange(
                      education.startDate,
                      education.endDate,
                      false,
                    )}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.italic, styles.grow]}>
                    {education.institutionName}
                  </Text>
                  <Text style={[styles.italic, styles.right]}>
                    {education.location}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}
      </Page>
    </Document>
  );
}
