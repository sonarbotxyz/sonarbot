import { getSupabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { enrichSignal, formatEnrichedNotification } from "@/lib/pipeline/signal-context";

export interface InsertedSignal {
  id: string;
  project_id: string;
  type: string;
  title: string;
  description: string | null;
}

export async function notifyWatchers(signals: InsertedSignal[]) {
  const supabase = getSupabase();

  for (const signal of signals) {
    // Get all watchers of this project
    const { data: watchers } = await supabase
      .from("watches")
      .select("user_id")
      .eq("project_id", signal.project_id);

    if (!watchers?.length) continue;

    const userIds = watchers.map((w) => w.user_id);

    // Get alert preferences for these users
    const { data: prefs } = await supabase
      .from("alert_preferences")
      .select(
        "user_id, metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events"
      )
      .in("user_id", userIds)
      .eq("project_id", signal.project_id);

    // Filter to users who want this signal type
    const signalTypeColumn = signal.type;
    const eligibleUserIds = (prefs || [])
      .filter(
        (p) =>
          p[signalTypeColumn as keyof typeof p] === true
      )
      .map((p) => p.user_id);

    if (!eligibleUserIds.length) continue;

    // Get telegram links for eligible users (only those with chat_id set)
    const { data: links } = await supabase
      .from("telegram_links")
      .select("user_id, chat_id")
      .in("user_id", eligibleUserIds)
      .not("chat_id", "is", null);

    if (!links?.length) continue;

    // Get project name
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", signal.project_id)
      .single();

    const projectName = project?.name || "Unknown";

    // Send notifications
    for (const link of links) {
      const message =
        `<b>${projectName}</b>\n\n` +
        `${signal.title}\n` +
        (signal.description ? `${signal.description}\n\n` : "\n") +
        `→ sonarbot.vercel.app/project/${signal.project_id}`;

      await sendTelegramMessage(link.chat_id, message);

      // Insert notification record
      await supabase.from("notifications").insert({
        user_id: link.user_id,
        signal_id: signal.id,
        project_id: signal.project_id,
        sent_via: "telegram",
      });
    }
  }
}

/**
 * Enrich a signal with cross-source context and notify watchers
 * with the richer Telegram format.
 */
export async function notifyEnriched(
  signal: InsertedSignal,
  projectName: string,
  twitterHandle: string,
  githubRepo: string
): Promise<void> {
  const supabase = getSupabase();

  // Get watchers
  const { data: watchers } = await supabase
    .from("watches")
    .select("user_id")
    .eq("project_id", signal.project_id);

  if (!watchers?.length) return;

  const userIds = watchers.map((w) => w.user_id);

  // Filter by alert preferences
  const { data: prefs } = await supabase
    .from("alert_preferences")
    .select(
      "user_id, metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events"
    )
    .in("user_id", userIds)
    .eq("project_id", signal.project_id);

  const signalTypeColumn = signal.type;
  const eligibleUserIds = (prefs || [])
    .filter((p) => p[signalTypeColumn as keyof typeof p] === true)
    .map((p) => p.user_id);

  if (!eligibleUserIds.length) return;

  // Get telegram links
  const { data: links } = await supabase
    .from("telegram_links")
    .select("user_id, chat_id")
    .in("user_id", eligibleUserIds)
    .not("chat_id", "is", null);

  if (!links?.length) return;

  // Enrich the signal with context
  const context = await enrichSignal(
    {
      type: signal.type,
      title: signal.title,
      description: signal.description || "",
      project_id: signal.project_id,
    },
    projectName,
    twitterHandle,
    githubRepo
  );

  const message = formatEnrichedNotification(projectName, context);

  // Send to all eligible users
  for (const link of links) {
    await sendTelegramMessage(link.chat_id, message);

    await supabase.from("notifications").insert({
      user_id: link.user_id,
      signal_id: signal.id,
      project_id: signal.project_id,
      sent_via: "telegram",
    });
  }
}
