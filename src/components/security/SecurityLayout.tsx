import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft, Clock, Home, User } from "lucide-react";
import logoHorizontal from "@/assets/logo_blue_horizontal.png";
import {
  clearSecuritySession,
  getMainAppPath,
  getSecuritySession,
  updateSecuritySession,
  type SecuritySession,
} from "@/lib/securitySession";
import { resolveAssignedProperties } from "@/api/security";

type SecuritySessionContextValue = {
  session: SecuritySession;
  logout: () => void;
  setSelectedPropertyId: (id: string) => void;
};

const SecuritySessionContext =
  React.createContext<SecuritySessionContextValue | null>(null);

export const useSecuritySession = () => {
  const context = React.useContext(SecuritySessionContext);
  if (!context) {
    throw new Error("useSecuritySession must be used within SecurityLayout");
  }
  return context;
};

const NAV_ITEMS = [
  { name: "Home", href: "/security/home", icon: Home },
  { name: "History", href: "/security/history", icon: Clock },
  { name: "Profile", href: "/security/profile", icon: User },
] as const;

export const SecurityLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [session, setSession] = React.useState<SecuritySession | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [mainAppPath, setMainAppPath] = React.useState("/auth/login");

  React.useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const current = getSecuritySession();
      if (!current) {
        void router.replace("/security");
        return;
      }
      setMainAppPath(getMainAppPath());
      if (current.properties.length === 0 && current.token) {
        const properties = await resolveAssignedProperties(current.token, {
          phoneNumber: current.phoneNumber,
          userId: current.userId,
        });
        if (cancelled) return;
        if (properties.length > 0) {
          const next = updateSecuritySession({
            properties,
            selectedPropertyId: properties[0]?.id ?? null,
          });
          setSession(next ?? { ...current, properties, selectedPropertyId: properties[0].id });
          setIsReady(true);
          return;
        }
      }
      if (cancelled) return;
      setSession(current);
      setIsReady(true);
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = React.useCallback(() => {
    clearSecuritySession();
    void router.replace("/security");
  }, [router]);

  const setSelectedPropertyId = React.useCallback((id: string) => {
    const next = updateSecuritySession({ selectedPropertyId: id });
    if (next) setSession(next);
  }, []);

  const isActive = React.useCallback(
    (href: string) => router.pathname === href,
    [router.pathname],
  );
  const showMobileLogo = router.pathname !== "/security/profile";

  if (!isReady || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-main border-t-transparent" />
      </div>
    );
  }

  return (
    <SecuritySessionContext.Provider
      value={{ session, logout, setSelectedPropertyId }}
    >
      <Head>
        <title>Dwelliva · Security</title>
      </Head>
      <div className="min-h-screen bg-white lg:bg-slate-50">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white px-6 py-8 lg:flex">
          <Image
            src={logoHorizontal}
            alt="Dwelliva"
            width={170}
            height={40}
            className="mb-10 h-auto w-40 object-contain"
            priority
          />
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-brand-main-bg text-brand-main"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <Link
            href={mainAppPath}
            className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-main"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dwelliva
          </Link>
        </aside>

        {showMobileLogo ? (
          <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <Link
                href={mainAppPath}
                className="inline-flex items-center gap-1 justify-self-start text-xs font-medium text-gray-500 transition hover:text-brand-main"
              >
                <ArrowLeft className="h-4 w-4" />
                Dwelliva
              </Link>
              <Image
                src={logoHorizontal}
                alt="Dwelliva"
                width={150}
                height={36}
                className="h-auto w-32 object-contain"
                priority
              />
              <span />
            </div>
          </header>
        ) : null}

        <main className="pb-24 lg:ml-64 lg:min-h-screen lg:pb-10">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white lg:hidden">
          <div className="flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition ${
                    active ? "text-brand-main" : "text-gray-500"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </SecuritySessionContext.Provider>
  );
};
