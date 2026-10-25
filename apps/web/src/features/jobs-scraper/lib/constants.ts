export const JOB_SOURCES = [
  "LinkedIn",
  "JobStreet",
  "OnlineJobs.ph",
  "Indeed",
] as const;
export const JOB_WORK_MODES = ["Remote", "Hybrid", "Onsite"] as const;
export const JOB_TIME_RANGES = [
  "LAST_HOUR",
  "TODAY",
  "THIS_WEEK",
  "CUSTOM",
] as const;
export const JOB_TIME_RANGE_LABELS: Record<
  (typeof JOB_TIME_RANGES)[number],
  string
> = {
  LAST_HOUR: "Last hour",
  TODAY: "Today only",
  THIS_WEEK: "This week",
  CUSTOM: "Custom range",
};
export const JOB_CLASSIFICATIONS = ["MATCH", "POTENTIAL", "REJECTED"] as const;
export const JOB_CLASSIFICATION_LABELS: Record<
  (typeof JOB_CLASSIFICATIONS)[number],
  string
> = {
  MATCH: "Match",
  POTENTIAL: "Potential",
  REJECTED: "Rejected",
};
