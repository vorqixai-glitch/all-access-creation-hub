import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/")({
  beforeLoad: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw redirect({ to: "/auth" });
    const userId = session.session.user.id;

    // Latest thread, else create one
    const { data: existing } = await supabase
      .from("threads")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let threadId = existing?.id;
    if (!threadId) {
      const { data: created, error } = await supabase
        .from("threads")
        .insert({ user_id: userId })
        .select("id")
        .single();
      if (error) throw error;
      threadId = created.id;
    }
    throw redirect({ to: "/chat/$threadId", params: { threadId } });
  },
  component: () => null,
});
