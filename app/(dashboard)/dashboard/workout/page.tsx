import WorkoutTracker from "./_components/WorkoutTracker";
import { toTrackerExercises } from "./_lib/build-plan";

export default async function WorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: encoded } = await searchParams;

  let initialExercises;
  if (encoded) {
    try {
      const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
      initialExercises = toTrackerExercises(decoded);
    } catch {
      // Ignore malformed param — fall back to default EXERCISE_LIBRARY
    }
  }

  return <WorkoutTracker initialExercises={initialExercises} />;
}
