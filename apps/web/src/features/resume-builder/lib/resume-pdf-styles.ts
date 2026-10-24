import { StyleSheet } from "@react-pdf/renderer";

export const resumePdfStyles = StyleSheet.create({
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
