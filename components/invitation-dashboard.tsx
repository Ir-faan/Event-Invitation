"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  PackageCheck,
  RefreshCcw,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { InvitationPhonePreview } from "@/components/invitation-phone-preview";
import {
  calculateInvitationPrice,
  getHeroPresets,
  normalizeInvitationConfig,
  openingAssets,
  paletteOptions,
  type InvitationConfig,
  type InvitationSection,
} from "@/lib/invitation-designer";
import {
  getPrimaryEventDate,
  type InvitationOrderRecord,
  type InvitationOrderStatus,
  type InvitationOrderSummary,
} from "@/lib/invitation-orders";

type DashboardOrder = InvitationOrderRecord & { summary: InvitationOrderSummary };
type StatusFilter = "all" | InvitationOrderStatus;

const statusLabels: Record<InvitationOrderStatus, string> = {
  pending: "Needs review",
  active: "Live",
  inactive: "Inactive",
};

export function InvitationDashboard() {
  const [orders, setOrders] = useState<InvitationOrderSummary[]>([]);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<DashboardOrder | null>(null);
  const [draft, setDraft] = useState<InvitationConfig | null>(null);
  const [activeUntil, setActiveUntil] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [action, setAction] = useState<"save" | "deploy" | "deactivate" | "" >("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<"details" | "preview">("details");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const response = await fetch("/api/dashboard/orders", { cache: "no-store" });
      const data = await response.json() as { orders?: InvitationOrderSummary[]; today?: string; error?: string };
      if (!response.ok || !data.orders) throw new Error(data.error || "Orders could not be loaded.");
      setOrders(data.orders);
      setToday(data.today || new Date().toISOString().slice(0, 10));
    } catch (loadError) {
      setListError(loadError instanceof Error ? loadError.message : "Orders could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOrders(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((order) => order.status === "pending").length,
    active: orders.filter((order) => order.status === "active").length,
    inactive: orders.filter((order) => order.status === "inactive").length,
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return orders
      .filter((order) => statusFilter === "all" || order.status === statusFilter)
      .filter((order) => !query || [order.coupleName, order.customerName, order.phone, order.slug, order.id]
        .some((value) => value?.toLocaleLowerCase().includes(query)))
      .sort((a, b) => (statusRank[a.status] - statusRank[b.status]) || b.created_at.localeCompare(a.created_at));
  }, [orders, search, statusFilter]);

  async function openOrder(id: string) {
    setDetailLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/dashboard/orders?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json() as { order?: DashboardOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "This order could not be loaded.");
      const config = normalizeInvitationConfig(data.order.config);
      setSelected({ ...data.order, config });
      setDraft(config);
      setActiveUntil(suggestActiveUntil(data.order, config, today));
      setMobilePanel("details");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "This order could not be loaded.");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeOrder() {
    setSelected(null);
    setDraft(null);
    setNotice("");
    setError("");
    void loadOrders();
  }

  async function updateOrder(nextAction: "save" | "deploy" | "deactivate") {
    if (!selected || !draft) return;
    if (nextAction === "deactivate" && !window.confirm("Take this invitation offline now? You can redeploy it later.")) return;
    setAction(nextAction);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/dashboard/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          action: nextAction,
          config: nextAction === "deactivate" ? undefined : draft,
          activeUntil: nextAction === "deploy" ? activeUntil : undefined,
        }),
      });
      const data = await response.json() as { order?: DashboardOrder; publicUrl?: string; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "The order could not be updated.");
      const config = normalizeInvitationConfig(data.order.config);
      setSelected({ ...data.order, config });
      setDraft(config);
      setActiveUntil(suggestActiveUntil(data.order, config, today));
      setOrders((current) => upsertSummary(current, data.order!.summary));
      if (nextAction === "save") setNotice("Manual edits saved.");
      if (nextAction === "deactivate") setNotice("Invitation taken offline. Its preview and order history are still available.");
      if (nextAction === "deploy") setNotice(`Invitation is live at ${data.publicUrl ?? `/${data.order.slug}`}`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The order could not be updated.");
    } finally {
      setAction("");
    }
  }

  if (selected && draft) {
    return (
      <DashboardDetail
        order={selected}
        config={draft}
        activeUntil={activeUntil}
        today={today}
        action={action}
        notice={notice}
        error={error}
        previewKey={previewKey}
        mobilePanel={mobilePanel}
        onBack={closeOrder}
        onConfig={setDraft}
        onActiveUntil={setActiveUntil}
        onAction={updateOrder}
        onReplay={() => setPreviewKey((key) => key + 1)}
        onMobilePanel={setMobilePanel}
      />
    );
  }

  return (
    <main className="orders-dashboard">
      <DashboardHeader onRefresh={loadOrders} loading={loading} />
      <div className="orders-dashboard-content">
        <section className="orders-intro">
          <div>
            <span className="orders-eyebrow"><ShieldCheck aria-hidden="true" /> Invitation operations</span>
            <h1>Your invitation orders</h1>
            <p>Review new requests, publish approved invitations, and manage every live or previous order from one place.</p>
          </div>
          <div className="orders-today"><Clock3 aria-hidden="true" /><span>Mauritius date<strong>{formatDate(today)}</strong></span></div>
        </section>

        <section className="orders-metrics" aria-label="Order summary">
          <MetricCard icon={<Sparkles />} label="Need your review" value={counts.pending} tone="pending" hint="Ready to check and deploy" />
          <MetricCard icon={<PackageCheck />} label="Currently live" value={counts.active} tone="active" hint="Available to guests" />
          <MetricCard icon={<CalendarClock />} label="Previous orders" value={counts.inactive} tone="inactive" hint="Offline, but safely retained" />
          <MetricCard icon={<CircleDollarSign />} label="Order value" value={formatMoney(orders.reduce((sum, order) => sum + order.total_price, 0))} tone="value" hint="Across all saved orders" />
        </section>

        <section className="orders-list-card">
          <div className="orders-list-toolbar">
            <div>
              <span className="orders-eyebrow"><LayoutDashboard aria-hidden="true" /> Order desk</span>
              <h2>All invitations</h2>
            </div>
            <label className="orders-search"><Search aria-hidden="true" /><span className="sr-only">Search orders</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names, phone or link…" /></label>
          </div>

          <div className="orders-filters" aria-label="Filter orders">
            <Filter aria-hidden="true" />
            {(["all", "pending", "active", "inactive"] as StatusFilter[]).map((status) => (
              <button key={status} type="button" className={statusFilter === status ? "is-active" : ""} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>
                {status === "all" ? "All" : statusLabels[status]} <span>{counts[status]}</span>
              </button>
            ))}
          </div>

          {listError && <DashboardError>{listError}</DashboardError>}
          {error && <DashboardError>{error}</DashboardError>}
          {loading ? <DashboardLoading /> : visibleOrders.length ? (
            <div className="orders-table" role="table" aria-label="Invitation orders">
              <div className="orders-table-head" role="row">
                <span>Invitation</span><span>Customer</span><span>Celebration</span><span>Price</span><span>Status</span><span />
              </div>
              {visibleOrders.map((order) => <OrderRow key={order.id} order={order} onOpen={() => void openOrder(order.id)} />)}
            </div>
          ) : (
            <div className="orders-empty"><Search aria-hidden="true" /><h3>No matching orders</h3><p>Try a different search or status filter.</p></div>
          )}
        </section>
      </div>
      {detailLoading && <div className="orders-loading-overlay"><Loader2 aria-hidden="true" /><span>Opening order…</span></div>}
    </main>
  );
}

function DashboardHeader({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <header className="orders-header">
      <Link className="orders-brand" href="/dashboard" aria-label="Paperless Invites dashboard">
        <span>PI</span><div><strong>Paperless Invites</strong><small>Private dashboard</small></div>
      </Link>
      <button type="button" onClick={onRefresh} disabled={loading}><RefreshCcw className={loading ? "is-spinning" : ""} aria-hidden="true" /> Refresh orders</button>
    </header>
  );
}

function MetricCard({ icon, label, value, tone, hint }: { icon: ReactNode; label: string; value: number | string; tone: string; hint: string }) {
  return <article className={`orders-metric is-${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{hint}</p></div></article>;
}

function OrderRow({ order, onOpen }: { order: InvitationOrderSummary; onOpen: () => void }) {
  return (
    <button className="orders-row" type="button" onClick={onOpen} role="row">
      <span className="orders-row-invitation" role="cell"><i>{initials(order.coupleName)}</i><span><strong>{order.coupleName}</strong><small>{order.slug ? `/${order.slug}` : `Order ${order.id.slice(0, 8)}`}</small></span></span>
      <span role="cell"><strong>{order.customerName}</strong><small>{formatPhone(order.phone)}</small></span>
      <span role="cell"><strong>{formatDate(order.eventDate)}</strong><small>{order.sectionCount} invitation parts</small></span>
      <span role="cell"><strong>{formatMoney(order.total_price)}</strong><small>{formatRelativeDate(order.created_at)}</small></span>
      <span role="cell"><StatusChip status={order.status} />{order.status === "active" && <small>Until {formatDate(order.active_until)}</small>}</span>
      <span className="orders-row-arrow" role="cell"><ChevronRight aria-hidden="true" /></span>
    </button>
  );
}

type DetailProps = {
  order: DashboardOrder;
  config: InvitationConfig;
  activeUntil: string;
  today: string;
  action: "save" | "deploy" | "deactivate" | "";
  notice: string;
  error: string;
  previewKey: number;
  mobilePanel: "details" | "preview";
  onBack: () => void;
  onConfig: (config: InvitationConfig) => void;
  onActiveUntil: (date: string) => void;
  onAction: (action: "save" | "deploy" | "deactivate") => void;
  onReplay: () => void;
  onMobilePanel: (panel: "details" | "preview") => void;
};

function DashboardDetail(props: DetailProps) {
  const { order, config, activeUntil, today, action, notice, error, previewKey, mobilePanel, onBack, onConfig, onActiveUntil, onAction, onReplay, onMobilePanel } = props;
  const publicPath = order.slug ? `/${order.slug}` : "";
  const price = calculateInvitationPrice(config).total;
  return (
    <main className="orders-dashboard order-detail-page">
      <header className="order-detail-header">
        <button className="order-back" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> All orders</button>
        <div className="order-detail-title"><span>{initials(order.summary.coupleName)}</span><div><small>Order {order.id.slice(0, 8)}</small><h1>{config.hero.firstName || "Bride"} &amp; {config.hero.secondName || "Groom"}</h1></div></div>
        <StatusChip status={order.status} />
      </header>

      <div className="order-detail-summary">
        <span><small>Customer</small><strong>{config.contact.name || "Not entered"}</strong></span>
        <span><small>Phone</small><strong>{formatPhone(config.contact.phone)}</strong></span>
        <span><small>Event date</small><strong>{formatDate(getPrimaryEventDate(config))}</strong></span>
        <span><small>Current price</small><strong>{formatMoney(price)}</strong></span>
        <span><small>Last updated</small><strong>{formatDateTime(order.updated_at)}</strong></span>
      </div>

      <section className="order-deploy-bar" aria-label="Invitation publishing controls">
        <div className="order-deploy-copy"><Rocket aria-hidden="true" /><div><strong>{order.status === "active" ? "This invitation is live" : order.status === "inactive" ? "Ready to redeploy?" : "Ready after your review"}</strong><small>{order.status === "active" ? `Guests can open ${publicPath}` : "Choose the final active date, then publish in one tap."}</small></div></div>
        <label><span>Keep active until</span><input type="date" value={activeUntil} min={today} onChange={(event) => onActiveUntil(event.target.value)} /></label>
        <button className="order-primary-action" type="button" onClick={() => onAction("deploy")} disabled={Boolean(action) || !activeUntil}>
          {action === "deploy" ? <Loader2 className="is-spinning" aria-hidden="true" /> : <Rocket aria-hidden="true" />}
          {order.status === "pending" ? "Deploy invitation" : order.status === "inactive" ? "Redeploy invitation" : "Update live date"}
        </button>
        {order.status === "active" && <button className="order-danger-action" type="button" onClick={() => onAction("deactivate")} disabled={Boolean(action)}>{action === "deactivate" ? <Loader2 className="is-spinning" /> : <span aria-hidden="true">×</span>} Take offline</button>}
        {order.slug && <PublicLink slug={order.slug} isActive={order.status === "active"} />}
      </section>

      {notice && <div className="orders-notice"><Check aria-hidden="true" />{notice}</div>}
      {error && <DashboardError>{error}</DashboardError>}

      <div className="order-mobile-tabs" aria-label="Order view">
        <button className={mobilePanel === "details" ? "is-active" : ""} type="button" onClick={() => onMobilePanel("details")}>Edit details</button>
        <button className={mobilePanel === "preview" ? "is-active" : ""} type="button" onClick={() => onMobilePanel("preview")}>Preview invitation</button>
      </div>

      <div className={`order-detail-workspace show-${mobilePanel}`}>
        <section className="order-editor-panel">
          <div className="order-panel-heading"><div><span className="orders-eyebrow"><Eye aria-hidden="true" /> Full order values</span><h2>Review and edit</h2><p>Every customer-entered value is available below. Changes stay private until you save or deploy.</p></div><button type="button" onClick={() => onAction("save")} disabled={Boolean(action)}>{action === "save" ? <Loader2 className="is-spinning" /> : <Save />} Save edits</button></div>
          <OrderConfigEditor config={config} onChange={onConfig} />
        </section>

        <aside className="order-preview-panel">
          <InvitationPhonePreview config={config} replayKey={previewKey} focusTarget="" focusKey={0} onReplay={onReplay} />
        </aside>
      </div>
    </main>
  );
}

function PublicLink({ slug, isActive }: { slug: string; isActive: boolean }) {
  const [copied, setCopied] = useState(false);
  const path = `/${slug}`;
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div className="order-public-link">
      <span>{isActive ? "Live invitation link" : "Previous link (currently offline)"}</span>
      <strong>{path}</strong>
      <button type="button" onClick={() => void copy()}>{copied ? <Check /> : <Copy />}<span className="sr-only">Copy link</span></button>
      {isActive && <a href={path} target="_blank" rel="noreferrer"><ExternalLink /><span className="sr-only">Open live invitation</span></a>}
    </div>
  );
}

function OrderConfigEditor({ config, onChange }: { config: InvitationConfig; onChange: (config: InvitationConfig) => void }) {
  const presets = getHeroPresets(config);
  const openingChoices = config.opening.type === "envelope" ? openingAssets.envelope : openingAssets.curtain;
  function update(mutator: (next: InvitationConfig) => void) {
    const next = structuredClone(config);
    mutator(next);
    onChange(next);
  }
  return (
    <div className="order-config-editor">
      <EditorGroup title="Customer contact" hint="Used to contact the customer about approval and payment." open>
        <div className="order-field-grid">
          <EditorField label="Customer name"><input value={config.contact.name} onChange={(event) => update((next) => { next.contact.name = event.target.value; })} /></EditorField>
          <EditorField label="Mauritian phone"><input inputMode="numeric" pattern="5[0-9]{7}" maxLength={8} value={config.contact.phone} onChange={(event) => update((next) => { next.contact.phone = event.target.value.replace(/\D/g, "").slice(0, 8); })} /></EditorField>
          {config.contact.phone && <a className="order-whatsapp" href={`https://wa.me/230${config.contact.phone}`} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" /> Message customer on WhatsApp</a>}
        </div>
      </EditorGroup>

      <EditorGroup title="Colours and opening" hint="Palette, Bismillah and the chosen opening experience.">
        <div className="order-field-grid">
          <EditorField label="Colour palette"><select value={config.palette} onChange={(event) => update((next) => { next.palette = event.target.value as InvitationConfig["palette"]; next.hero.presetIndex = 0; })}>{paletteOptions.map((palette) => <option key={palette.id} value={palette.id}>{palette.name}</option>)}</select></EditorField>
          <EditorField label="Bismillah"><select value={String(config.bismillah.enabled)} onChange={(event) => update((next) => { next.bismillah.enabled = event.target.value === "true"; })}><option value="true">Shown</option><option value="false">Hidden</option></select></EditorField>
          <EditorField label="Opening type"><select value={config.opening.type} onChange={(event) => update((next) => { const type = event.target.value as InvitationConfig["opening"]["type"]; next.opening.type = type; if (type === "envelope") next.opening.asset = openingAssets.envelope[0].id; if (type === "curtain") next.opening.asset = openingAssets.curtain[0].id; })}><option value="none">No opening</option><option value="envelope">Envelope</option><option value="curtain">Curtain reveal</option></select></EditorField>
          {config.opening.type !== "none" && <EditorField label="Opening artwork"><select value={config.opening.asset} onChange={(event) => update((next) => { next.opening.asset = event.target.value; })}>{openingChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></EditorField>}
          {config.opening.type === "envelope" && <EditorField label="Wax-seal initials"><input value={config.opening.initials} maxLength={12} onChange={(event) => update((next) => { next.opening.initials = event.target.value; })} /></EditorField>}
        </div>
      </EditorGroup>

      <EditorGroup title="Main photo area" hint="Hero style, selected photo and all visible hero text.">
        <div className="order-field-grid">
          <EditorField label="Hero type"><select value={config.hero.type} onChange={(event) => update((next) => { next.hero.type = event.target.value as InvitationConfig["hero"]["type"]; next.hero.presetIndex = 0; if (next.hero.type === "basic") { next.hero.photoSource = "preset"; next.hero.uploadedUrl = ""; } })}><option value="basic">Basic hero</option><option value="interactive">Interactive scratch hero</option></select></EditorField>
          {config.hero.type === "interactive" && <EditorField label="Photo source"><select value={config.hero.photoSource} onChange={(event) => update((next) => { next.hero.photoSource = event.target.value as "preset" | "upload"; })}><option value="preset">Preset photo</option><option value="upload">Customer upload</option></select></EditorField>}
          {config.hero.photoSource === "preset" ? <EditorField label="Selected photo"><select value={config.hero.presetIndex} onChange={(event) => update((next) => { next.hero.presetIndex = Number(event.target.value); })}>{presets.map((preset, index) => <option key={preset.id} value={index}>{preset.name}</option>)}</select></EditorField> : <EditorField label="Uploaded photo URL" full><input type="url" value={config.hero.uploadedUrl} onChange={(event) => update((next) => { next.hero.uploadedUrl = event.target.value; })} /></EditorField>}
          <EditorField label="Small text above names" full><input value={config.hero.eyebrow} onChange={(event) => update((next) => { next.hero.eyebrow = event.target.value; })} /></EditorField>
          <EditorField label="First name"><input value={config.hero.firstName} onChange={(event) => update((next) => { next.hero.firstName = event.target.value; })} /></EditorField>
          <EditorField label="Second name"><input value={config.hero.secondName} onChange={(event) => update((next) => { next.hero.secondName = event.target.value; })} /></EditorField>
          <EditorField label="Invitation message" full><textarea value={config.hero.message} onChange={(event) => update((next) => { next.hero.message = event.target.value; })} /></EditorField>
        </div>
      </EditorGroup>

      <div className="order-section-editors">
        {config.sections.map((section, sectionIndex) => (
          <SectionValueEditor key={section.id} section={section} index={sectionIndex} onChange={(nextSection) => update((next) => { next.sections[sectionIndex] = nextSection; })} />
        ))}
      </div>
    </div>
  );
}

function SectionValueEditor({ section, index, onChange }: { section: InvitationSection; index: number; onChange: (section: InvitationSection) => void }) {
  function update(mutator: (next: InvitationSection) => void) {
    const next = structuredClone(section);
    mutator(next);
    onChange(next);
  }
  return (
    <EditorGroup title={`${String(index + 1).padStart(2, "0")} · ${section.title || humanize(section.type)}`} hint={`${humanize(section.type)} · ${section.included ? "Included part" : "Additional part"}`}>
      <div className="order-field-grid">
        <EditorField label="Section heading" full><input value={section.title} onChange={(event) => update((next) => { next.title = event.target.value; })} disabled={section.type === "custom"} /></EditorField>
        {Object.entries(section.fields).map(([key, value]) => (
          <EditorField key={key} label={humanize(key)} full={isLongValue(key, value)}>{renderValueInput(key, value, (nextValue) => update((next) => { next.fields[key] = nextValue; }))}</EditorField>
        ))}
      </div>
      {section.items?.map((item, itemIndex) => (
        <fieldset className="order-item-values" key={itemIndex}>
          <legend>{itemLabel(section.type, itemIndex)}</legend>
          <div className="order-field-grid">
            {Object.entries(item).map(([key, value]) => <EditorField key={key} label={humanize(key)} full={isLongValue(key, value)}>{renderValueInput(key, value, (nextValue) => update((next) => { if (next.items) next.items[itemIndex][key] = nextValue; }))}</EditorField>)}
          </div>
        </fieldset>
      ))}
      {section.images.length > 0 && (
        <fieldset className="order-item-values">
          <legend>Gallery photos</legend>
          <div className="order-field-grid">
            {section.images.map((image, imageIndex) => <EditorField key={imageIndex} label={`Photo ${imageIndex + 1} URL`} full><input type="url" value={image} onChange={(event) => update((next) => { next.images[imageIndex] = event.target.value; })} /></EditorField>)}
          </div>
        </fieldset>
      )}
      {section.type === "custom" && <p className="order-custom-note">This part remains consultation-led. Its final design can be added after speaking with the customer.</p>}
    </EditorGroup>
  );
}

function EditorGroup({ title, hint, open = false, children }: { title: string; hint: string; open?: boolean; children: ReactNode }) {
  return <details className="order-editor-group" open={open}><summary><span><strong>{title}</strong><small>{hint}</small></span><ChevronRight aria-hidden="true" /></summary><div className="order-editor-group-body">{children}</div></details>;
}

function EditorField({ label, full = false, children }: { label: string; full?: boolean; children: ReactNode }) {
  return <label className={`order-field ${full ? "is-full" : ""}`}><span>{label}</span>{children}</label>;
}

function renderValueInput(key: string, value: string, onChange: (value: string) => void) {
  const common = { value, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value) };
  if (key.toLocaleLowerCase().includes("date") && /^\d{4}-\d{2}-\d{2}$/.test(value)) return <input type="date" {...common} />;
  if (key.toLocaleLowerCase() === "time") return <input type="time" {...common} />;
  if (key.toLocaleLowerCase().includes("url")) return <input type="url" {...common} />;
  if (isLongValue(key, value)) return <textarea {...common} />;
  return <input {...common} />;
}

function StatusChip({ status }: { status: InvitationOrderStatus }) {
  return <span className={`order-status is-${status}`}><i />{statusLabels[status]}</span>;
}

function DashboardError({ children }: { children: ReactNode }) {
  return <div className="orders-error" role="alert"><strong>Something needs attention</strong><span>{children}</span></div>;
}

function DashboardLoading() {
  return <div className="orders-loading"><Loader2 className="is-spinning" aria-hidden="true" /><span>Loading your invitation orders…</span></div>;
}

const statusRank: Record<InvitationOrderStatus, number> = { pending: 0, active: 1, inactive: 2 };

function upsertSummary(orders: InvitationOrderSummary[], summary: InvitationOrderSummary) {
  const index = orders.findIndex((order) => order.id === summary.id);
  if (index < 0) return [summary, ...orders];
  return orders.map((order) => order.id === summary.id ? summary : order);
}

function suggestActiveUntil(order: InvitationOrderRecord, config: InvitationConfig, today: string) {
  const eventDate = getPrimaryEventDate(config);
  const candidate = order.active_until || eventDate || today;
  return candidate >= today ? candidate : today;
}

function formatMoney(value: number) {
  return `Rs ${new Intl.NumberFormat("en-MU").format(value)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return `Received ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date)}`;
}

function formatPhone(phone: string) {
  return /^5\d{7}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4)}` : phone || "Not entered";
}

function initials(value: string) {
  return value.split(/\s+&\s+|\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase() || "PI";
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/-/g, " ").replace(/^\w|\s\w/g, (letter) => letter.toLocaleUpperCase());
}

function isLongValue(key: string, value: string) {
  return /message|description|introduction|families|details|note/i.test(key) || value.length > 80 || value.includes("\n");
}

function itemLabel(type: InvitationSection["type"], index: number) {
  if (type === "seating") return `Table ${index + 1}`;
  if (type === "journey") return `Journey moment ${index + 1}`;
  if (type === "event-details") return `Event ${index + 1}`;
  if (type === "day-programme") return `Programme item ${index + 1}`;
  return `Item ${index + 1}`;
}
