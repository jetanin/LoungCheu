import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getIdentity, mutate, type Identity } from "../lib/api";
import { Login } from "../features/auth/Login";
import { EventPage } from "../features/events/EventPage";
import { EventOverview } from "../features/events/EventOverview";

function navigate(path: string) {
  if (window.location.pathname !== path)
    window.history.replaceState({}, "", path);
}
export function App() {
  const [identity, setIdentity] = useState<Identity | null>(null),
    [loading, setLoading] = useState(true);
  const [error, setError] = useState(""),
    [loggingOut, setLoggingOut] = useState(false),
    [logoutFailed, setLogoutFailed] = useState(false);
  const [sessionWarning, setSessionWarning] = useState("");
  const generation = useRef(0),
    sessionEpoch = useRef(0);
  const [path, setPath] = useState(window.location.pathname);
  const isOverview = /^\/organizer\/?$/.test(path);
  const isSharedList = /^\/events\/?$/.test(path);
  const go = useCallback((target: string) => {
    navigate(target);
    setPath(target);
  }, []);
  const authRequired = useCallback(() => {
    generation.current++;
    sessionEpoch.current++;
    setIdentity(null);
    setError("");
    setSessionWarning("");
    go("/login");
  }, [go]);
  const check = useCallback(
    async (background = false) => {
      // A newer check supersedes every older response, including a stale 200
      // arriving after the current session has already been rejected.
      const requestGeneration = ++generation.current;
      const epoch = sessionEpoch.current;
      try {
        const user = await getIdentity();
        if (requestGeneration === generation.current) {
          setIdentity(user);
          setError("");
          setSessionWarning("");
          // Preserve the current detail/form route during identity polling/focus.
          const current = window.location.pathname;
          if (
            /^\/organizer\/?$/.test(current) ||
            /^\/(?:organizer\/)?events(?:\/[^/]+)?\/?$/.test(current)
          )
            setPath(current);
          else go("/events");
        }
      } catch (failure) {
        if (epoch !== sessionEpoch.current) return;
        // A definitive rejection of this session must still clear private state
        // when a newer background read only failed to connect. A different login
        // has a new epoch and cannot be invalidated by the previous account.
        if (failure instanceof ApiError && failure.status === 401) {
          authRequired();
          setLoading(false);
          return;
        }
        if (requestGeneration !== generation.current) return;
        if (background)
          setSessionWarning("ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
        else {
          setIdentity(null);
          setError("ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
        }
      } finally {
        if (requestGeneration === generation.current) setLoading(false);
      }
    },
    [authRequired, go],
  );
  useEffect(() => {
    void check();
    return () => {
      generation.current++;
    };
  }, [check]);
  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      // A history-cache snapshot may belong to a session logged out elsewhere.
      sessionEpoch.current++;
      setIdentity(null);
      setSessionWarning("");
      setLoading(true);
      void check();
    };
    window.addEventListener("pageshow", restored);
    return () => window.removeEventListener("pageshow", restored);
  }, [check]);
  useEffect(() => {
    if (!identity) return;
    const refresh = () => {
      void check(true);
    };
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("popstate", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("popstate", refresh);
    };
  }, [identity, check]);
  async function logout() {
    generation.current++;
    sessionEpoch.current++;
    setIdentity(null);
    setSessionWarning("");
    setLoggingOut(true);
    setLogoutFailed(false);
    setError("");
    go("/login");
    try {
      await mutate("/auth/logout");
    } catch (failure) {
      if (!(failure instanceof ApiError && failure.status === 401)) {
        setError("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
        setLogoutFailed(true);
      }
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <nav
          className="container app-header-inner"
          aria-label="เมนูหลัก"
        >
          <a
            className="brand text-decoration-none"
            href={identity ? "/events" : "/login"}
          >
            <span className="brand-mark" aria-hidden="true">
              ลช
            </span>
            LoungCheu
          </a>
          {identity && (
            <div className="header-account">
              <span className="header-identity" title={identity.display_name}>
                {identity.display_name}
              </span>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={() => void logout()}
              >
                ออกจากระบบ
              </button>
            </div>
          )}
        </nav>
      </header>
      <main className="container app-main">
        {sessionWarning && (
          <div className="alert alert-warning" role="alert">
            {sessionWarning}{" "}
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => void check(true)}
            >
              ตรวจสอบอีกครั้ง
            </button>
          </div>
        )}
        {loading || loggingOut ? (
          <p role="status" className="text-center py-5">
            {loggingOut ? "กำลังออกจากระบบ…" : "กำลังตรวจสอบการเข้าสู่ระบบ…"}
          </p>
        ) : error ? (
          <div className="card login-card page-panel">
            <p role="alert">{error}</p>
            <button
              className="btn btn-success"
              onClick={() => {
                if (logoutFailed) void logout();
                else {
                  setLoading(true);
                  void check();
                }
              }}
            >
              ลองใหม่
            </button>
          </div>
        ) : identity ? (
          <>
            <nav className="event-nav" aria-label="เมนูกิจกรรม">
              {identity.role === "ORGANIZER" && (
                <a
                  href="/organizer"
                  aria-current={isOverview ? "page" : undefined}
                >
                  ภาพรวม
                </a>
              )}
              <a
                href="/events"
                aria-current={path.startsWith("/events") ? "page" : undefined}
              >
                กิจกรรมทั้งหมด
              </a>
              {identity.role === "ORGANIZER" && (
                <a
                  href="/organizer/events"
                  aria-current={
                    path.startsWith("/organizer/events") ? "page" : undefined
                  }
                >
                  กิจกรรมของฉัน
                </a>
              )}
            </nav>
            {isSharedList && (
              <section className="page-heading" aria-labelledby="welcome-title"><div>
                <h1 id="welcome-title" className="page-title">
                  สวัสดี {identity.display_name}
                </h1>
                <p className="page-subtitle">
                  {identity.role === "ORGANIZER"
                    ? "ผู้จัดกิจกรรม"
                    : "ผู้เข้าร่วมกิจกรรม"}
                </p>
              </div></section>
            )}
            {isOverview ? (
              <EventOverview
                key={`${identity.id}:${identity.role}:overview`}
                identity={identity}
                onAuthRequired={authRequired}
              />
            ) : (
              <EventPage
                key={`${identity.id}:${identity.role}:${path}`}
                path={path}
                identity={identity}
                onAuthRequired={authRequired}
                onNavigate={go}
              />
            )}
          </>
        ) : (
          <Login
            onLogin={(user) => {
              generation.current++;
              sessionEpoch.current++;
              setSessionWarning("");
              setIdentity(user);
              go("/events");
            }}
          />
        )}
      </main>
      <footer className="container app-footer">
        LoungCheu · กิจกรรมดี ๆ เริ่มที่การลงชื่อ
      </footer>
    </div>
  );
}
