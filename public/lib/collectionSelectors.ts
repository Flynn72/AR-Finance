import type { CollectionActivity } from "../types";

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function getCollectionKPIs(activities: CollectionActivity[]) {
  const now = new Date();
  const totalThisMonth = activities.filter((a) => isSameMonth(a.activity_date, now)).length;

  const activePtp = activities.filter(
    (a) => a.is_ptp && a.promise_payment_date && new Date(a.promise_payment_date) >= now
  );
  const activePtpCount = activePtp.length;
  const activePtpValue = activePtp.reduce((sum, a) => sum + (a.promise_amount ?? 0), 0);

  const followUpDueCount = activities.filter(
    (a) => a.next_follow_up && new Date(a.next_follow_up) <= now
  ).length;

  return { totalThisMonth, activePtpCount, activePtpValue, followUpDueCount };
}

export interface FollowUpItem {
  activity: CollectionActivity;
  isOverdue: boolean;
}

export function getFollowUpList(activities: CollectionActivity[]): FollowUpItem[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return activities
    .filter((a) => !!a.next_follow_up)
    .map((activity) => ({
      activity,
      isOverdue: new Date(activity.next_follow_up as string) < now,
    }))
    .sort(
      (a, b) =>
        new Date(a.activity.next_follow_up as string).getTime() -
        new Date(b.activity.next_follow_up as string).getTime()
    );
}
