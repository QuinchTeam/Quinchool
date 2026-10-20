export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export function dayPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

export const GREETINGS: Record<DayPeriod, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Good night",
};

// Weekday index 0 is Sunday.
const MESSAGES: Record<DayPeriod, string>[] = [
  {
    morning: "Slow Sunday. Rest is part of the work.",
    afternoon: "Recharge now, so Monday finds you ready.",
    evening: "Plan lightly. Next week starts with one small step.",
    night: "Sleep well. A fresh week is waiting.",
  },
  {
    morning: "Happy Monday. Start small, start strong.",
    afternoon: "One task at a time. Momentum is building.",
    evening: "You showed up today. That counts.",
    night: "Good start to the week. Rest up.",
  },
  {
    morning: "Tuesday is for steady progress.",
    afternoon: "Keep going. Small wins add up fast.",
    evening: "Look back at today. You moved forward.",
    night: "Close the tabs. Tomorrow is a clean slate.",
  },
  {
    morning: "Halfway there. You've got this.",
    afternoon: "Midweek focus: finish one thing well.",
    evening: "Over the hump. Be proud of the climb.",
    night: "Rest easy. The second half is yours.",
  },
  {
    morning: "Thursday energy: almost at the finish line.",
    afternoon: "Push a little more. Friday is close.",
    evening: "Solid work this week. Keep the streak alive.",
    night: "One more day. Sleep on a job well done.",
  },
  {
    morning: "Happy Friday. Finish the week strong.",
    afternoon: "Wrap it up. You earned the weekend.",
    evening: "Week done. Celebrate the progress.",
    night: "Unplug tonight. You did great this week.",
  },
  {
    morning: "Saturday: time for the projects you love.",
    afternoon: "Learn something new just for fun today.",
    evening: "Enjoy the evening. Balance keeps you going.",
    night: "Rest well. Good things take time.",
  },
];

export function greetingMessage(weekday: number, period: DayPeriod): string {
  return MESSAGES[weekday]?.[period] ?? "";
}

// Weekday uses JavaScript's Sunday=0 convention on the Manila clock.
export function manilaClock(date: Date): { hour: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
    timeZone: "Asia/Manila",
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    hour: Number(part("hour")),
    weekday: weekdays.indexOf(part("weekday") ?? "Sun"),
  };
}
