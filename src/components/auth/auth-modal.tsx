"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { useViewer, useViewerActions } from "@/components/auth/viewer-provider";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInStatic, signOutStatic } from "@/lib/static-auth";

type AuthModalProps = {
  toggleId: string;
};

const initialState: LoginActionState = {};

type LoginActionState = {
  error?: string;
};

export function AuthModal({ toggleId }: AuthModalProps) {
  const viewer = useViewer();
  const { setViewer } = useViewerActions();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LoginActionState>(initialState);
  const [isPending, setIsPending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const returnTo = pathname.startsWith("/admin") ? "/" : currentPath;

  useEffect(() => {
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    window.addEventListener("pf-auth-modal:open", open);
    window.addEventListener("pf-auth-modal:close", close);

    return () => {
      window.removeEventListener("pf-auth-modal:open", open);
      window.removeEventListener("pf-auth-modal:close", close);
    };
  }, []);

  const closeAuth = () => setIsOpen(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    setState(initialState);

    try {
      const result = await signInStatic(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
      if (!result.ok) {
        setState({ error: result.error });
        return;
      }

      setViewer(result.viewer);
      closeAuth();
      window.history.replaceState(null, "", returnTo);
    } finally {
      setIsPending(false);
    }
  };

  const submitLogout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await signOutStatic();
    setViewer(null);
    closeAuth();
    window.location.replace("/");
  };

  return (
    <div className={`fixed inset-0 z-[12050] ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={closeAuth}
        aria-hidden="true"
      />

      <div
        className={`relative z-[12051] mx-auto flex min-h-full items-start justify-center px-4 pt-[96px] transition-opacity lg:pt-[136px] ${isOpen ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!isOpen}
      >
        <div className="w-[min(92vw,26rem)] max-w-none overflow-hidden rounded-[2rem] border border-[var(--pf-border-warm)] bg-[var(--pf-surface)] p-0 text-[var(--pf-text)] shadow-[0_30px_80px_rgba(29,24,20,0.26)]">
          <div className="flex items-center justify-between border-b border-[rgba(200,154,21,0.12)] px-5 py-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[var(--pf-muted)]">Acceso</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--pf-text)]">{viewer ? "Mi cuenta" : "Iniciar sesión"}</h2>
            </div>

            <button
              type="button"
              onClick={closeAuth}
              className={`${buttonVariants({ variant: "secondary", size: "icon" })} h-10 w-10 rounded-full`}
              aria-label="Cerrar acceso"
            >
              <X className="size-5" />
            </button>
          </div>

          {!viewer ? (
            <form onSubmit={submitLogin} className="space-y-4 px-5 py-5">
              <input type="hidden" name="returnTo" value={returnTo} />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-[var(--pf-muted)]" htmlFor={`${toggleId}-email`}>
                  Correo
                </label>
                <Input
                  id={`${toggleId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="min-h-[52px] rounded-[1rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.92)] px-4 text-sm outline-none transition focus:border-[var(--pf-primary)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-[var(--pf-muted)]" htmlFor={`${toggleId}-password`}>
                  Contraseña
                </label>
                <Input
                  id={`${toggleId}-password`}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="min-h-[52px] rounded-[1rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.92)] px-4 text-sm outline-none transition focus:border-[var(--pf-primary)]"
                />
              </div>

              {state.error ? (
                <p className="rounded-2xl border border-[rgba(227,48,38,0.22)] bg-[rgba(227,48,38,0.08)] px-4 py-3 text-sm font-medium text-[#9c2c1d]">
                  {state.error}
                </p>
              ) : null}

              <div className="grid gap-3 pt-2">
                <button type="submit" className={buttonVariants({ variant: "primary", size: "md" })} disabled={isPending}>
                  {isPending ? "Ingresando..." : "Entrar"}
                </button>
                <button type="button" onClick={closeAuth} className={buttonVariants({ variant: "secondary", size: "md" })}>
                  Cerrar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-[1.35rem] border border-[var(--pf-border)] bg-[rgba(255,255,255,0.85)] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[var(--pf-muted)]">Sesión activa</p>
                <p className="mt-2 text-lg font-black text-[var(--pf-text)]">{viewer.name}</p>
                <p className="mt-1 text-sm text-[var(--pf-muted)]">{viewer.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[rgba(200,154,21,0.12)] px-3 py-1 text-xs font-semibold text-[var(--pf-primary-darker)]">
                    {viewer.role}
                  </span>
                  {viewer.isAdmin ? (
                    <span className="rounded-full bg-[rgba(74,125,82,0.12)] px-3 py-1 text-xs font-semibold text-[var(--pf-success)]">
                      Administrador
                    </span>
                  ) : (
                    <span className="rounded-full bg-[rgba(200,154,21,0.08)] px-3 py-1 text-xs font-semibold text-[var(--pf-muted)]">
                      Cliente
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-3 pt-2">
                {viewer.isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={closeAuth}
                    className={`${buttonVariants({ variant: "primary", size: "md" })} w-full !text-white`}
                  >
                    Administración
                  </Link>
                ) : null}
                <form onSubmit={submitLogout}>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className={`${buttonVariants({ variant: "secondary", size: "md" })} w-full`}>
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
