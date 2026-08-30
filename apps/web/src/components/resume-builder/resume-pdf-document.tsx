import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { displayUrl, formatDateRange } from "@/lib/resume";
import type { CareerProfileValues } from "@/lib/validations/career-profile";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#000000",
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.25,
    padding: 34,
  },
  header: {
    alignItems: "center",
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    lineHeight: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  contacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 10,
    justifyContent: "center",
    lineHeight: 1,
    marginTop: 6,
  },
  link: {
    borderBottomColor: "#000000",
    borderBottomStyle: "dotted",
    borderBottomWidth: 1.5,
    color: "#000000",
    paddingBottom: 0.5,
    textDecoration: "none",
  },
  phoneLink: {
    color: "#000000",
    textDecoration: "none",
  },
  separator: {
    marginHorizontal: 4,
  },
  section: {
    marginTop: 9,
  },
  sectionTitle: {
    borderBottomColor: "#000000",
    borderBottomWidth: 0.7,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginBottom: 3,
    paddingBottom: 1,
    textTransform: "uppercase",
  },
  entry: {
    marginBottom: 12,
  },
  lastEntry: {
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  grow: {
    flexGrow: 1,
    flexShrink: 1,
  },
  right: {
    flexShrink: 0,
    marginLeft: 12,
    textAlign: "right",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  italic: {
    fontFamily: "Helvetica-Oblique",
  },
  companyRow: {
    marginBottom: 3,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 10,
  },
  bulletMark: {
    width: 9,
  },
  bulletText: {
    flex: 1,
  },
  skillLine: {
    marginBottom: 3,
  },
  education: {
    marginBottom: 6,
  },
});

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
  profile: CareerProfileValues;
}) {
  const contacts = [
    { label: profile.email, src: `mailto:${profile.email}` },
    ...(profile.linkedin
      ? [{ label: displayUrl(profile.linkedin), src: profile.linkedin }]
      : []),
    ...(profile.personalWebsite
      ? [
          {
            label: displayUrl(profile.personalWebsite),
            src: profile.personalWebsite,
          },
        ]
      : []),
    ...(profile.github
      ? [{ label: displayUrl(profile.github), src: profile.github }]
      : []),
    { label: profile.contactNumber, src: `tel:${profile.contactNumber}` },
  ];

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
