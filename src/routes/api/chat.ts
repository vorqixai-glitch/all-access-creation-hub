import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "@/lib/ai-gateway.server";

type ChatBody = {
  messages?: UIMessage[];
  model?: string;
  system?: string;
  threadId?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Verify session + get user id
        const { createClient } = await import("@supabase/supabase-js");
        const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userErr } = await supa.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        // Free-tier daily cap: 30 messages
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supa
          .from("usage_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);
        if ((count ?? 0) >= 30) {
          return new Response(
            JSON.stringify({ error: "Daily free-tier limit reached (30 messages / 24h). Upgrade to continue." }),
            { status: 429, headers: { "content-type": "application/json" } },
          );
        }

        const modelId = body.model || DEFAULT_MODEL;
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway(modelId);

        const systemPrompt =
          body.system ||
          "You are a helpful, versatile AI assistant on the Nexus platform. Be concise, accurate, and format responses with markdown when useful.";

        try {
          const result = streamText({
            model,
            system: systemPrompt,
            messages: convertToModelMessages(body.messages),
            onFinish: async ({ usage, text }) => {
              try {
                await supa.from("usage_events").insert({
                  user_id: userId,
                  model: modelId,
                  tokens_in: usage?.inputTokens ?? 0,
                  tokens_out: usage?.outputTokens ?? 0,
                });
                if (body.threadId) {
                  // persist assistant message
                  await supa.from("messages").insert({
                    thread_id: body.threadId,
                    user_id: userId,
                    role: "assistant",
                    parts: [{ type: "text", text }],
                    model: modelId,
                    tokens_in: usage?.inputTokens ?? null,
                    tokens_out: usage?.outputTokens ?? null,
                  });
                  // persist the latest user message if not already stored
                  const lastUser = [...body.messages!].reverse().find((m) => m.role === "user");
                  if (lastUser) {
                    await supa.from("messages").insert({
                      thread_id: body.threadId,
                      user_id: userId,
                      role: "user",
                      parts: lastUser.parts as unknown as object[],
                    });
                  }
                  await supa.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", body.threadId);
                }
              } catch (e) {
                console.error("persist error", e);
              }
            },
          });

          return result.toUIMessageStreamResponse({ originalMessages: body.messages });
        } catch (e) {
          console.error("stream error", e);
          const msg = e instanceof Error ? e.message : "AI request failed";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
