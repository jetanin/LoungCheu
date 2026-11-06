import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Identity } from "../../lib/api";
import { bangkokTime, type OwnerEvent } from "./model";

type IconKind = "calendar" | "draft" | "published" | "create";
function Icon({ kind, size = 24 }: { kind: IconKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "draft" ? (
        <>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
          <path d="M14 3v6h6M8 13h8M8 17h5" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
          {kind === "published" ? (
            <path d="m8 16 3 3 5-5" />
          ) : kind === "create" ? (
            <path d="M12 14v5M9.5 16.5h5" />
          ) : (
            <path d="M8 15h2M14 15h2M8 18h2M14 18h2" />
          )}
        </>
      )}
    </svg>
  );
}

export function EventOverview({
  identity,
  onAuthRequired,
}: {
  identity: Identity;
  onAuthRequired: () => void;
}) {
  const [events, setEvents] = useState<OwnerEvent[] | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const activeRead = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (identity.role !== "ORGANIZER") return;
    activeRead.current?.abort();
    const controller = new AbortController();
    activeRead.current = controller;
    setLoading(true);
    setError("");
    try {
      const result = await api<OwnerEvent[]>("/organizer/events", {
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setEvents(result);
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) {
        setEvents(null);
        onAuthRequired();
      } else {
        if (failure instanceof ApiError && [403, 404].includes(failure.status))
          setEvents(null);
        setError(
          failure instanceof ApiError
            ? failure.message
            : "โหลดภาพรวมไม่สำเร็จ กรุณาลองใหม่",
        );
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [identity.id, identity.role, onAuthRequired]);
  useEffect(() => {
    void refresh();
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      activeRead.current?.abort();
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);

  if (identity.role !== "ORGANIZER")
    return (
      <section className="card page-panel" role="alert">
        <h1 className="page-title">ไม่มีสิทธิ์ใช้งาน</h1>
      </section>
    );
  const stats: { label: string; kind: IconKind; value: number | undefined }[] =
    [
      { label: "กิจกรรมทั้งหมด", kind: "calendar", value: events?.length },
      {
        label: "ฉบับร่าง",
        kind: "draft",
        value: events?.filter((event) => event.status === "DRAFT").length,
      },
      {
        label: "กิจกรรมเผยแพร่",
        kind: "published",
        value: events?.filter((event) => event.status === "PUBLISHED").length,
      },
    ];
  return (
    <section className="organizer-overview" aria-label="ภาพรวมกิจกรรมของผู้จัด">
      <div className="page-heading">
        <div>
          <h1 className="page-title">สวัสดี {identity.display_name}</h1>
          <p className="page-subtitle">
            สร้าง เผยแพร่ และติดตามกิจกรรมของคุณได้ในที่เดียว
          </p>
        </div>
        <a
          className="btn btn-success overview-create"
          href="/organizer/events/new"
        >
          <span aria-hidden="true">＋</span> สร้างกิจกรรม
        </a>
      </div>
      <div className="overview-stats" aria-busy={loading}>
        {stats.map((stat) => (
          <article
            className="card overview-stat"
            aria-label={stat.label}
            key={stat.label}
          >
            <Icon kind={stat.kind} />
            <p className="overview-stat-value">{stat.value ?? "—"}</p>
            <h2 className="overview-stat-label">{stat.label}</h2>
          </article>
        ))}
      </div>
      {loading && (
        <p role="status" className="small text-secondary mt-3">
          {events ? "กำลังรีเฟรชภาพรวมกิจกรรม…" : "กำลังโหลดภาพรวมกิจกรรม…"}
        </p>
      )}
      {error && (
        <div className="alert alert-warning mt-3" role="alert">
          {error}{" "}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => void refresh()}
          >
            ลองใหม่
          </button>
        </div>
      )}
      <section
        className="card overview-events"
        aria-labelledby="overview-events-title"
      >
        <div className="overview-events-heading">
          <h2 id="overview-events-title" className="section-title">
            กิจกรรมของฉัน
          </h2>
          <a className="link-success" href="/organizer/events">
            ดูทั้งหมด
          </a>
        </div>
        {events && !events.length && (
          <div className="overview-empty">
            <span className="overview-empty-icon">
              <Icon kind="create" size={30} />
            </span>
            <h3 className="h6 mt-4 mb-3">ยังไม่มีกิจกรรมที่สร้าง</h3>
            <p className="text-secondary mb-3">
              เริ่มสร้างกิจกรรมแรกของคุณ เพื่อเปิดรับผู้เข้าร่วม
            </p>
            <a className="btn btn-success" href="/organizer/events/new">
              <span aria-hidden="true">＋</span> สร้างกิจกรรมแรก
            </a>
          </div>
        )}
        {events && !!events.length && (
          <ul className="overview-event-list">
            {events.slice(0, 3).map((event) => (
              <li key={event.id}>
                <div>
                  <h3 className="event-item-title mb-2">
                    <a
                      className="link-success"
                      href={`/organizer/events/${event.id}`}
                    >
                      {event.title}
                    </a>
                  </h3>
                  <p className="small text-secondary mb-0">
                    {event.location} · {bangkokTime(event.starts_at)} ·
                    Asia/Bangkok
                  </p>
                </div>
                <span className="event-status" data-status={event.status}>
                  {event.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
