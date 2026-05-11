import { supabase } from "@/lib/supabase";
import CobotDashboard from "./CobotDashboard";

export default async function Home() {
  const { data: dailyReports } = await supabase
    .from("daily_reports")
    .select("*")
    .order("date", { ascending: false });

  const { data: moduleRatings } = await supabase
    .from("module_ratings")
    .select("*");

  const { data: taskTrials } = await supabase
    .from("task_trials")
    .select("*")
    .order("trial_number", { ascending: true });

  return (
    <CobotDashboard
      dailyReports={dailyReports ?? []}
      moduleRatings={moduleRatings ?? []}
      taskTrials={taskTrials ?? []}
    />
  );
}