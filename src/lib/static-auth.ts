import siteContent from "@/data/site-content.json";
import type { AuthRole, ViewerSession } from "@/domain/viewer";
import type { SiteContentDocument } from "@/domain/site-content";

const content = siteContent as unknown as SiteContentDocument;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

function normalizeRole(role: string | null | undefined): AuthRole {
  const normalized = String(role ?? "").trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador" ? "Administrador" : "Cliente";
}

function toViewerSession(authUserId: string, email: string): ViewerSession | null {
  const row = (content.users ?? []).find((user) => {
    return user.authUserId === authUserId || user.email.toLowerCase() === email.toLowerCase();
  });

  if (!row || !row.active) {
    return null;
  }

  const role = normalizeRole(row.role);

  return {
    authenticated: true,
    userId: row.id,
    authUserId,
    email: row.email,
    name: row.name,
    role,
    canSeePrices: row.canSeePrices || role === "Administrador",
    active: row.active,
    isAdmin: role === "Administrador",
  };
}

async function signInWithPhp(email: string, password: string) {
  const response = await fetch("/api/auth/login.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 404 || response.status === 405) {
    return null;
  }

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    viewer?: ViewerSession;
    error?: string;
  };

  if (!response.ok || !payload.ok || !payload.viewer) {
    return {
      ok: false as const,
      error: payload.error || "Correo o contraseña incorrectos.",
    };
  }

  return {
    ok: true as const,
    viewer: payload.viewer,
  };
}

async function signInWithSupabase(email: string, password: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false as const,
      error: "El acceso todavía no está configurado.",
    };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    return {
      ok: false as const,
      error: "Correo o contraseña incorrectos.",
    };
  }

  const viewer = toViewerSession(data.user.id, data.user.email);

  if (!viewer) {
    await supabase.auth.signOut().catch(() => undefined);
    return {
      ok: false as const,
      error: "Tu cuenta no tiene perfil habilitado.",
    };
  }

  return {
    ok: true as const,
    viewer,
  };
}

export async function signInStatic(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    return {
      ok: false as const,
      error: "Completá correo y contraseña.",
    };
  }

  try {
    const phpResult = await signInWithPhp(normalizedEmail, normalizedPassword);
    if (phpResult) {
      return phpResult;
    }
  } catch {
    // Static preview has no PHP runtime; fall back to browser Supabase auth.
  }

  return signInWithSupabase(normalizedEmail, normalizedPassword);
}

export async function signOutStatic() {
  await fetch("/api/auth/logout.php", {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);

  if (supabaseUrl && supabaseAnonKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.auth.signOut().catch(() => undefined);
  }
}
