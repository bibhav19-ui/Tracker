// ============================================================
// Daily deadline digest — Supabase Edge Function (Phase 2)
// Emails your team each morning with what's due.
//
// Secrets required (set with the Supabase CLI or dashboard):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (auto-available)
//   RESEND_API_KEY   -> from https://resend.com (free tier)
//   DIGEST_FROM      -> e.g. "Severn Accounting <alerts@yourdomain.co.uk>"
//   DIGEST_TO        -> comma-separated team emails
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in7 = new Date(today); in7.setDate(today.getDate() + 7);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // Pull open jobs due up to +7 days (includes anything overdue)
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("type,label,due,notes,clients(name,type)")
    .eq("done", false)
    .lte("due", iso(in7))
    .order("due", { ascending: true });

  if (error) return new Response(error.message, { status: 500 });

  const overdue: string[] = [];
  const soon: string[] = [];
  for (const t of tasks ?? []) {
    const due = new Date(t.due + "T00:00:00");
    const label = t.label || t.type;
    const client = (t as any).clients?.name ?? "Unknown client";
    const line = `<li><b>${client}</b> — ${label} — due ${due.toLocaleDateString("en-GB")}${t.notes ? ` (${t.notes})` : ""}</li>`;
    (due < today ? overdue : soon).push(line);
  }

  if (overdue.length === 0 && soon.length === 0) {
    return new Response("Nothing due — no email sent.", { status: 200 });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;color:#12242e">
      <h2>Deadlines — ${today.toLocaleDateString("en-GB")}</h2>
      ${overdue.length ? `<h3 style="color:#b3261e">Overdue (${overdue.length})</h3><ul>${overdue.join("")}</ul>` : ""}
      ${soon.length ? `<h3 style="color:#9a6b00">Due within 7 days (${soon.length})</h3><ul>${soon.join("")}</ul>` : ""}
      <p style="font-size:12px;color:#3a4f59">Open the tracker to update these.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("DIGEST_FROM"),
      to: (Deno.env.get("DIGEST_TO") ?? "").split(",").map((s) => s.trim()),
      subject: `Deadlines — ${overdue.length} overdue, ${soon.length} due soon`,
      html,
    }),
  });

  return new Response(await res.text(), { status: res.ok ? 200 : 500 });
});
