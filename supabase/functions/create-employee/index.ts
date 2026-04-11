
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get caller's role and organization
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role, organization_id")
      .eq("user_id", caller.id)
      .single();

    if (!callerRole) throw new Error("Caller role not found");

    const callerOrgId = callerRole.organization_id;

    // Validate permissions
    const { email, password, full_name, phone, role, farm_id } = await req.json();

    if (!email || !password || !full_name) {
      throw new Error("Email, password, and full name are required");
    }

    // Owner can only add managers
    if (callerRole.role === "owner") {
      if (role && role !== "manager") {
        throw new Error("Owner can only add managers");
      }
    }
    // Manager can add senior_employee or employee
    else if (callerRole.role === "manager") {
      if (role === "owner" || role === "manager") {
        throw new Error("Managers can only add senior employees and employees");
      }
    } else {
      throw new Error("Only owners and managers can add members");
    }

    const assignedRole = role || (callerRole.role === "owner" ? "manager" : "employee");

    // Create the user via admin API with org metadata so the trigger knows
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        organization_id: callerOrgId,
        invited_role: assignedRole,
      },
    });

    if (createError) throw createError;

    // Update phone in profile
    if (phone) {
      await adminClient
        .from("profiles")
        .update({ phone })
        .eq("user_id", newUser.user.id);
    }

    // Assign to farm if specified
    if (farm_id) {
      await adminClient.from("farm_assignments").insert({
        user_id: newUser.user.id,
        farm_id,
        role: assignedRole,
        organization_id: callerOrgId,
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
