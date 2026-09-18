"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Check,
  Copy,
  Eye,
  ExternalLink,
  Files,
  Loader2,
  LogOut,
  PackageCheck,
  PencilLine,
  Plus,
  RefreshCcw,
  Rocket,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { InvitationDesigner, type AdminInvitationOrder } from "@/components/invitation-designer";
import { OrderConfirmationModal } from "@/components/order-confirmation-modal";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { customerWhatsAppUrl } from "@/lib/whatsapp-messages";
import type { InvitationOrderStatus, InvitationOrderSummary } from "@/lib/invitation-orders";

type SortKey = "coupleName" | "customerName" | "eventDate" | "created_at" | "total_price" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" };
type OrderAction = "delete" | "deactivate" | "review" | "duplicate";
type RowAction = { id: string; action: OrderAction } | null;
type Confirmation = { order: InvitationOrderSummary; action: OrderAction } | null;

const statusLabels: Record<InvitationOrderStatus, string> = {
  pending: "Need your review",
  active: "Currently live",
  inactive: "Previous order",
};

export function InvitationDashboard() {
  const [orders, setOrders] = useState<InvitationOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [visibleOrderValue, setVisibleOrderValue] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, active: 0, inactive: 0 });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const loadSequence = useRef(0);
  const [today, setToday] = useState("");
  const [publicOrigin, setPublicOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<InvitationOrderStatus>>(() => new Set(["pending"]));
  const [sort, setSort] = useState<SortState>({ key: "created_at", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<AdminInvitationOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [confirmationError, setConfirmationError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [copyingId, setCopyingId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [deployOrder, setDeployOrder] = useState<InvitationOrderSummary | null>(null);
  const [deployUntil, setDeployUntil] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [preparingLink, setPreparingLink] = useState(false);
  const [deployError, setDeployError] = useState("");
  const [deploySuccess, setDeploySuccess] = useState(false);
  const deployPreparationId = useRef(0);

  const loadOrders = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setListError("");
    try {
      const params = new URLSearchParams({ page: String(page), size: String(pageSize), search: debouncedSearch, statuses: [...activeStatuses].join(","), sort: sort.key, direction: sort.direction });
      const response = await fetch(`/api/dashboard/orders?${params}`, { cache: "no-store" });
      const data = await response.json() as { orders?: InvitationOrderSummary[]; total?: number; totalValue?: number; counts?: { pending: number; active: number; inactive: number }; today?: string; publicOrigin?: string; error?: string };
      if (!response.ok || !data.orders) throw new Error(data.error || "Orders could not be loaded.");
      if (sequence !== loadSequence.current) return;
      setOrders(data.orders);
      setTotal(data.total || 0);
      setVisibleOrderValue(data.totalValue || 0);
      setCounts(data.counts || { pending: 0, active: 0, inactive: 0 });
      if (page > 1 && page > Math.max(1, Math.ceil((data.total || 0) / pageSize))) setPage(Math.max(1, Math.ceil((data.total || 0) / pageSize)));
      setToday(data.today || new Date().toISOString().slice(0, 10));
      setPublicOrigin(data.publicOrigin || window.location.origin);
    } catch (error) {
      if (sequence === loadSequence.current) setListError(error instanceof Error ? error.message : "Orders could not be loaded.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, activeStatuses, sort]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOrders(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    if (!listError && !actionNotice) return;
    const timer = window.setTimeout(() => { setListError(""); setActionNotice(""); }, 5000);
    return () => window.clearTimeout(timer);
  }, [listError, actionNotice]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageOrders = orders;

  async function openOrder(id: string) {
    setDetailLoading(true);
    setListError("");
    try {
      const response = await fetch(`/api/dashboard/orders?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json() as { order?: AdminInvitationOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "This order could not be loaded.");
      setSelected(data.order);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "This order could not be loaded.");
    } finally {
      setDetailLoading(false);
    }
  }

  function toggleStatus(status: InvitationOrderStatus) {
    setPage(1);
    setActiveStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function updateSort(key: SortKey) {
    setPage(1);
    setSort((current) => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "created_at" || key === "total_price" ? "desc" : "asc" });
  }

  async function runRowAction(order: InvitationOrderSummary, action: OrderAction) {
    setRowAction({ id: order.id, action });
    setConfirmationError("");
    setActionNotice("");
    try {
      if (action === "duplicate") {
        const response = await fetch("/api/dashboard/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: order.id, revision: order.revision, action }),
        });
        const data = await response.json() as { order?: AdminInvitationOrder; error?: string };
        if (!response.ok || !data.order) throw new Error(data.error || "The order could not be duplicated.");
        setOrders((current) => upsertSummary(current, data.order!.summary));
        setPage(1);
        setActionNotice(`A separate copy of ${order.coupleName} is ready for review with its own link.`);
      } else if (action === "delete") {
        const response = await fetch(`/api/dashboard/orders?id=${encodeURIComponent(order.id)}&revision=${order.revision}`, { method: "DELETE" });
        const data = await response.json() as { deleted?: boolean; error?: string };
        if (!response.ok || !data.deleted) throw new Error(data.error || "The order could not be deleted.");
        setOrders((current) => current.filter((item) => item.id !== order.id));
      } else {
        const response = await fetch("/api/dashboard/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: order.id, revision: order.revision, action }),
        });
        const data = await response.json() as { order?: AdminInvitationOrder; error?: string };
        if (!response.ok || !data.order) throw new Error(data.error || "The order could not be updated.");
        setOrders((current) => upsertSummary(current, data.order!.summary));
      }
      setConfirmation(null);
      await loadOrders();
    } catch (error) {
      setConfirmationError(error instanceof Error ? error.message : "The order could not be updated.");
    } finally {
      setRowAction(null);
    }
  }

  function askToConfirm(order: InvitationOrderSummary, action: OrderAction) {
    setConfirmationError("");
    setConfirmation({ order, action });
  }

  async function prepareOrderLink(order: InvitationOrderSummary) {
    if (order.slug) return order;
    const response = await fetch("/api/dashboard/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, revision: order.revision, action: "prepare-link" }),
    });
    const data = await response.json() as { order?: AdminInvitationOrder; error?: string };
    if (!response.ok || !data.order?.slug) throw new Error(data.error || "The invitation link could not be prepared.");
    setOrders((current) => upsertSummary(current, data.order!.summary));
    return data.order.summary;
  }

  async function copyOrderLink(order: InvitationOrderSummary) {
    setCopyingId(order.id);
    setListError("");
    try {
      const readyOrder = await prepareOrderLink(order);
      await copyToClipboard(`${publicOrigin || window.location.origin}/${readyOrder.slug}`);
      setCopiedId(order.id);
      window.setTimeout(() => setCopiedId((current) => current === order.id ? "" : current), 2400);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "The link could not be copied.");
    } finally {
      setCopyingId("");
    }
  }

  function openDeploy(order: InvitationOrderSummary) {
    const requestId = ++deployPreparationId.current;
    const candidate = order.active_until || order.eventDate || today;
    setDeployUntil(candidate && candidate >= today ? candidate : today);
    setDeployOrder(order);
    setDeployError("");
    setDeploySuccess(false);
    setPreparingLink(!order.slug);
    if (!order.slug) {
      void prepareOrderLink(order).then((prepared) => {
        if (deployPreparationId.current === requestId) setDeployOrder((current) => current?.id === order.id ? prepared : current);
      }).catch((error) => {
        if (deployPreparationId.current === requestId) setDeployError(error instanceof Error ? error.message : "The invitation link could not be prepared.");
      }).finally(() => {
        if (deployPreparationId.current === requestId) setPreparingLink(false);
      });
    }
  }

  function closeDeploy() {
    if (deploying) return;
    deployPreparationId.current += 1;
    setDeployOrder(null);
    setPreparingLink(false);
  }

  async function deployFromTable() {
    if (!deployOrder?.slug || !deployUntil || preparingLink) return;
    setDeploying(true);
    setDeployError("");
    try {
      const response = await fetch("/api/dashboard/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deployOrder.id, revision: deployOrder.revision, action: "deploy", activeUntil: deployUntil }),
      });
      const data = await response.json() as { order?: AdminInvitationOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "The invitation could not be deployed.");
      setOrders((current) => upsertSummary(current, data.order!.summary));
      setDeployOrder(data.order.summary);
      setDeploySuccess(true);
      await loadOrders();
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : "The invitation could not be deployed.");
    } finally {
      setDeploying(false);
    }
  }

  if (selected) {
    return (
      <InvitationDesigner
        key={selected.id}
        adminOrder={selected}
        today={today}
        publicOrigin={publicOrigin}
        onAdminBack={() => { setSelected(null); void loadOrders(); }}
        onAdminOrderChange={(order) => {
          setSelected(order);
          setOrders((current) => upsertSummary(current, order.summary));
        }}
      />
    );
  }

  return (
    <main className="orders-dashboard">
      <DashboardHeader onRefresh={loadOrders} loading={loading} />
      <div className="orders-dashboard-content">
        <div className="orders-overview-layout">
          <section className="orders-list-card">
            <div className="orders-list-toolbar">
              <div><span>Order desk</span><h1>{filterHeading(activeStatuses)}</h1><p>{total} {total === 1 ? "order" : "orders"} in this view</p></div>
              <label className="orders-search"><Search aria-hidden="true" /><span className="sr-only">Search orders</span><input maxLength={120} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search names, phone or link…" /></label>
            </div>

            {listError && <DashboardError>{listError}</DashboardError>}
            {actionNotice && <p className="orders-action-notice" role="status"><Check aria-hidden="true" />{actionNotice}</p>}
            {loading ? <DashboardLoading /> : total ? (
              <>
                <div className="orders-table-scroll">
                  <table className="orders-datatable">
                    <thead><tr>
                      <SortableHeading label="Invitation" sortKey="coupleName" sort={sort} onSort={updateSort} />
                      <SortableHeading label="Customer" sortKey="customerName" sort={sort} onSort={updateSort} />
                      <th scope="col">Link</th>
                      <SortableHeading label="Event date" sortKey="eventDate" sort={sort} onSort={updateSort} />
                      <SortableHeading label="Created (Mauritius)" sortKey="created_at" sort={sort} onSort={updateSort} />
                      <SortableHeading label="Price" sortKey="total_price" sort={sort} onSort={updateSort} />
                      <SortableHeading label="Status" sortKey="status" sort={sort} onSort={updateSort} />
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr></thead>
                    <tbody>{pageOrders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        busy={rowAction?.id === order.id}
                        onOpen={() => void openOrder(order.id)}
                        onDeploy={() => openDeploy(order)}
                        onDelete={() => askToConfirm(order, "delete")}
                        onDuplicate={() => askToConfirm(order, "duplicate")}
                        onDeactivate={() => askToConfirm(order, "deactivate")}
                        onReview={() => askToConfirm(order, "review")}
                        onCopyLink={() => void copyOrderLink(order)}
                        publicOrigin={publicOrigin}
                        copying={copyingId === order.id}
                        copied={copiedId === order.id}
                      />
                    ))}</tbody>
                  </table>
                </div>
                <DataTableFooter count={total} page={safePage} pageSize={pageSize} totalPages={totalPages} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
              </>
            ) : <div className="orders-empty"><Search aria-hidden="true" /><h3>No matching orders</h3><p>Change the search or click the active status card again to see all orders.</p></div>}
          </section>

          <aside className="orders-metrics" aria-label="Order filters and summary">
            <div className="orders-metrics-heading"><span>Filter the table</span><p>Select one or more statuses. Unselect every card to show all orders.</p></div>
            <MetricCard icon={<Sparkles />} label="Need your review" value={counts.pending} tone="pending" hint="Ready to check and deploy" active={activeStatuses.has("pending")} onClick={() => toggleStatus("pending")} />
            <MetricCard icon={<PackageCheck />} label="Currently live" value={counts.active} tone="active" hint="Available to guests" active={activeStatuses.has("active")} onClick={() => toggleStatus("active")} />
            <MetricCard icon={<CalendarClock />} label="Previous orders" value={counts.inactive} tone="inactive" hint="Offline, but safely retained" active={activeStatuses.has("inactive")} onClick={() => toggleStatus("inactive")} />
            <MetricCard icon={<CircleDollarSign />} label="Order value" value={formatMoney(visibleOrderValue)} tone="value" hint="Total for the orders shown" />
          </aside>
        </div>
      </div>
      {detailLoading && <div className="orders-loading-overlay"><Loader2 className="is-spinning" aria-hidden="true" /><span>Opening order…</span></div>}
      {deployOrder && <DeployModal order={deployOrder} value={deployUntil} today={today} busy={deploying} preparingLink={preparingLink} success={deploySuccess} error={deployError} publicOrigin={publicOrigin} onValue={setDeployUntil} onClose={closeDeploy} onDeploy={() => void deployFromTable()} />}
      {confirmation && <OrderConfirmationModal {...confirmationDetails(confirmation)} busy={rowAction !== null} error={confirmationError} onCancel={() => setConfirmation(null)} onConfirm={() => void runRowAction(confirmation.order, confirmation.action)} />}
    </main>
  );
}

function DashboardHeader({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  async function signOut() {
    const response = await fetch("/api/admin-session", { method: "DELETE" });
    if (response.ok) window.location.assign("/login");
  }
  return (
    <header className="orders-header">
      <Link className="orders-brand" href="/dashboard" aria-label="Paperless Invites dashboard"><span>PI</span><div><strong>Paperless Invites</strong><small>Private dashboard</small></div></Link>
      <div className="orders-header-actions">
        <Link href="/design-invitation"><Plus aria-hidden="true" /> Create invitation</Link>
        <button type="button" onClick={onRefresh} disabled={loading}><RefreshCcw className={loading ? "is-spinning" : ""} aria-hidden="true" /> Refresh</button>
        <button type="button" onClick={() => void signOut()}><LogOut aria-hidden="true" /> Sign out</button>
      </div>
    </header>
  );
}

function MetricCard({ icon, label, value, tone, hint, active = false, onClick }: { icon: ReactNode; label: string; value: number | string; tone: string; hint: string; active?: boolean; onClick?: () => void }) {
  const content = <><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{hint}</p></div></>;
  return onClick
    ? <button type="button" className={`orders-metric is-${tone} ${active ? "is-selected" : ""}`} aria-pressed={active} onClick={onClick}>{content}</button>
    : <article className={`orders-metric is-${tone}`}>{content}</article>;
}

function SortableHeading({ label, sortKey, sort, onSort }: { label: string; sortKey: SortKey; sort: SortState; onSort: (key: SortKey) => void }) {
  const selected = sort.key === sortKey;
  return <th scope="col"><button type="button" onClick={() => onSort(sortKey)}>{label}{selected ? sort.direction === "asc" ? <ArrowUp /> : <ArrowDown /> : <ArrowUpDown />}</button></th>;
}

function OrderRow({ order, busy, onOpen, onDeploy, onDelete, onDuplicate, onDeactivate, onReview, onCopyLink, publicOrigin, copying, copied }: {
  order: InvitationOrderSummary;
  busy: boolean;
  onOpen: () => void;
  onDeploy: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDeactivate: () => void;
  onReview: () => void;
  onCopyLink: () => void;
  publicOrigin: string;
  copying: boolean;
  copied: boolean;
}) {
  const linkPath = `/${order.slug || order.suggestedSlug}`;
  const fullUrl = `${publicOrigin || "https://www.paperless-invites.com"}${linkPath}`;
  const whatsappUrl = customerWhatsAppUrl(order.phone, order.customerName, order.status === "active" && order.slug ? fullUrl : undefined);
  return (
    <tr className={order.hasCustomPart ? "has-custom-part" : undefined}>
      <td data-label="Invitation"><span className="orders-invitation-cell"><i>{initials(order.coupleName)}</i><span><strong>{order.coupleName}</strong><small title={order.id}>Order {order.id.slice(0, 8)}</small></span></span></td>
      <td data-label="Customer"><span className="orders-cell-stack"><strong>{order.customerName}</strong><small>{formatPhone(order.phone)}</small></span></td>
      <td data-label="Link"><button className="orders-link-button" type="button" onClick={onCopyLink} disabled={copying || busy} title={order.slug ? `Click to copy ${fullUrl}` : `Suggested ${fullUrl} · click to reserve and copy the exact link`} aria-label={`Copy ${order.coupleName}'s full invitation link`}>{copying ? <Loader2 className="is-spinning" aria-hidden="true" /> : copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}<span>{linkPath}</span></button>{order.slug?.includes("-copy") && <small className="orders-link-note is-full-url" title={fullUrl}>{fullUrl.replace(/^https?:\/\//, "")}</small>}{!order.slug && <small className="orders-link-note">Suggested · reserve on copy</small>}{copied && <small className="orders-link-note" role="status">Full link copied</small>}</td>
      <td data-label="Event date"><span className="orders-cell-stack"><strong>{formatDate(order.eventDate)}</strong><small>{order.sectionCount} invitation parts</small></span></td>
      <td data-label="Created (Mauritius)" title={`Supabase created_at stores this same moment in UTC: ${order.created_at}`}><span className="orders-cell-stack"><strong>{formatCreatedDate(order.created_at)}</strong><small>{formatCreatedTime(order.created_at)} · UTC+4</small></span></td>
      <td data-label="Price"><strong>{formatMoney(order.total_price)}</strong></td>
      <td data-label="Status"><span className="orders-cell-stack"><StatusChip status={order.status} />{order.status === "active" && <small>Until {formatDate(order.active_until)}</small>}</span></td>
      <td data-label="Actions"><div className="orders-row-actions">
        <button type="button" title="Edit and preview" aria-label={`Edit and preview ${order.coupleName}`} onClick={onOpen} disabled={busy}><PencilLine /></button>
        {order.status === "pending" && <button type="button" title="Duplicate this order" aria-label={`Duplicate ${order.coupleName}`} onClick={onDuplicate} disabled={busy}>{busy ? <Loader2 className="is-spinning" /> : <Files />}</button>}
        {order.status !== "active" && <a href={`/dashboard/preview/${order.id}`} target="_blank" rel="noreferrer" title="Show desktop browser preview (private)" aria-label={`Show private preview of ${order.coupleName}`}><Eye /></a>}
        {order.status === "active" && order.slug && <a href={`/${order.slug}`} target="_blank" rel="noreferrer" title="Open live invitation" aria-label={`Open ${order.coupleName}'s live invitation`}><ExternalLink /></a>}
        {order.status !== "active" && <button type="button" title="Deploy invitation" aria-label={`Deploy ${order.coupleName}`} onClick={onDeploy} disabled={busy}><Rocket /></button>}
        {order.status === "active" && <button className="is-undeploy" type="button" title="Undeploy to Previous orders" aria-label={`Take ${order.coupleName} offline`} onClick={onDeactivate} disabled={busy}>{busy ? <Loader2 className="is-spinning" /> : <Rocket />}</button>}
        {order.status !== "pending" && <button type="button" title="Move to Need your review" aria-label={`Move ${order.coupleName} to review`} onClick={onReview} disabled={busy}><RotateCcw /></button>}
        {whatsappUrl && order.status !== "inactive" && <a className="is-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer" title={order.status === "active" ? "WhatsApp customer with invitation link" : "Chat with customer on WhatsApp"} aria-label={order.status === "active" ? `WhatsApp ${order.customerName} with the live invitation link` : `WhatsApp ${order.customerName}`}><WhatsAppIcon /></a>}
        <button type="button" className="is-delete" title="Delete order" aria-label={`Delete ${order.coupleName}`} onClick={onDelete} disabled={busy}>{busy ? <Loader2 className="is-spinning" /> : <Trash2 />}</button>
      </div></td>
    </tr>
  );
}

function DataTableFooter({ count, page, pageSize, totalPages, onPage, onPageSize }: { count: number; page: number; pageSize: number; totalPages: number; onPage: (page: number) => void; onPageSize: (size: number) => void }) {
  const first = count ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, count);
  return (
    <footer className="orders-table-footer">
      <span>Showing {first}–{last} of {count}</span>
      <label>Rows<select value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label>
      <div><button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}><ChevronLeft /><span className="sr-only">Previous page</span></button><span>Page {page} of {totalPages}</span><button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages}><ChevronRight /><span className="sr-only">Next page</span></button></div>
    </footer>
  );
}

function DeployModal({ order, value, today, busy, preparingLink, success, error, publicOrigin, onValue, onClose, onDeploy }: {
  order: InvitationOrderSummary;
  value: string;
  today: string;
  busy: boolean;
  preparingLink: boolean;
  success: boolean;
  error: string;
  publicOrigin: string;
  onValue: (value: string) => void;
  onClose: () => void;
  onDeploy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const dateRef = useRef<HTMLInputElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const publicUrl = `${publicOrigin || "https://www.paperless-invites.com"}/${order.slug || order.suggestedSlug}`;
  const whatsappUrl = customerWhatsAppUrl(order.phone, order.customerName, publicUrl);

  useEffect(() => { dateRef.current?.focus(); }, []);
  useEffect(() => { if (success) copyRef.current?.focus(); }, [success]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape" && !busy) onClose(); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  async function copyLink() {
    if (!order.slug) return;
    try {
      await copyToClipboard(publicUrl);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopyError("The link could not be copied. Try again or select the URL manually.");
    }
  }

  return (
    <div className="orders-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`orders-deploy-modal ${success ? "is-success" : ""}`} role="dialog" aria-modal="true" aria-labelledby="orders-deploy-title" aria-describedby="orders-deploy-description">
        <button className="orders-deploy-close" type="button" onClick={onClose} disabled={busy} aria-label="Close publish invitation dialog"><X aria-hidden="true" /></button>
        <header className="orders-deploy-heading">
          <span className="orders-deploy-status-icon">{success ? <Check aria-hidden="true" /> : <Rocket aria-hidden="true" />}</span>
          <div>
            <p className="orders-deploy-eyebrow">{success ? "Invitation published" : "Publish invitation"}</p>
            <h2 id="orders-deploy-title">{success ? `${order.coupleName} is live` : `Make ${order.coupleName} live`}</h2>
            <p id="orders-deploy-description" className="orders-modal-description">{success ? "Everything is ready. Copy the public link or share it with your customer in one tap." : "Choose when it goes offline and review the public link before publishing."}</p>
          </div>
        </header>
        {!success && <label><span>Keep the invitation active until</span><input ref={dateRef} type="date" min={today} value={value} onChange={(event) => onValue(event.target.value)} /></label>}
        <div className="orders-deploy-link"><span>{success ? "Live invitation link" : "Invitation link"}</span><button ref={copyRef} type="button" onClick={() => void copyLink()} disabled={preparingLink || !order.slug} title={order.slug ? `Copy ${publicUrl}` : "Preparing an available link"}><span>{preparingLink ? "Preparing your link…" : publicUrl}</span>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button><small>{copied ? "Full link copied to clipboard" : !order.slug ? "The suggested address will be reserved before you can copy or deploy it." : !success ? "The link starts working when you deploy the invitation." : "Select the link above to copy it to your clipboard."}</small></div>
        {(error || copyError) && <p className="orders-modal-error" role="alert">{error || copyError}</p>}
        {copyError && <input className="orders-deploy-manual-copy" readOnly value={publicUrl} aria-label="Select the full invitation URL to copy manually" onFocus={(event) => event.currentTarget.select()} />}
        {success && <div className="orders-modal-feedback"><Check aria-hidden="true" /><span><strong>Available to guests now</strong><small>The invitation stays live until the date you selected.</small></span></div>}
        <div className={`orders-deploy-actions ${success && whatsappUrl ? "has-whatsapp" : ""}`}>{success ? <>{whatsappUrl && <a className="is-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={`Send ${order.customerName} the invitation link on WhatsApp`}><WhatsAppIcon /><span>WhatsApp</span></a>}<a href={`/${order.slug}`} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Open invitation</a><button type="button" onClick={onClose}><Check aria-hidden="true" /> Done</button></> : <><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="button" onClick={onDeploy} disabled={busy || preparingLink || !order.slug || !value}>{busy ? <Loader2 className="is-spinning" /> : <Rocket />} Deploy invitation</button></>}</div>
      </section>
    </div>
  );
}

function confirmationDetails({ order, action }: Exclude<Confirmation, null>) {
  if (action === "duplicate") return {
    icon: <Files aria-hidden="true" />,
    eyebrow: "Make a separate copy",
    title: `Duplicate ${order.coupleName}?`,
    description: "A new order needing your review will have the same design, price and its own copies of uploaded photos. Its invitation link will end in -copy so both orders can be managed independently.",
    confirmLabel: "Duplicate order",
    tone: "wine" as const,
  };
  if (action === "delete") return {
    icon: <Trash2 aria-hidden="true" />,
    eyebrow: "Delete order",
    title: `Delete ${order.coupleName}?`,
    description: "This permanently removes the order and its uploaded photos. This cannot be undone.",
    confirmLabel: "Delete permanently",
    tone: "danger" as const,
  };
  if (action === "deactivate") return {
    icon: <Rocket aria-hidden="true" style={{ transform: "rotate(180deg)" }} />,
    eyebrow: "Take offline",
    title: `Undeploy ${order.coupleName}?`,
    description: "Guests will lose access immediately. The order and its link stay saved under Previous orders, ready to redeploy later.",
    confirmLabel: "Undeploy invitation",
    tone: "danger" as const,
  };
  return {
    icon: <RotateCcw aria-hidden="true" />,
    eyebrow: "Return to review",
    title: `Review ${order.coupleName} again?`,
    description: "If it is live, the public invitation will become unavailable immediately. The order and its link are kept for your next review.",
    confirmLabel: "Move to review",
    tone: "wine" as const,
  };
}

function StatusChip({ status }: { status: InvitationOrderStatus }) {
  return <span className={`order-status is-${status}`}><i />{statusLabels[status]}</span>;
}

function DashboardError({ children }: { children: ReactNode }) {
  return <div className="orders-error" role="alert"><strong>Something needs attention</strong><span>{children}</span></div>;
}

function DashboardLoading() {
  return <div className="orders-loading"><Loader2 className="is-spinning" aria-hidden="true" /><span>Loading invitation orders…</span></div>;
}

function filterHeading(statuses: Set<InvitationOrderStatus>) {
  if (statuses.size === 0) return "All invitations";
  if (statuses.size === 1) return statusLabels[[...statuses][0]];
  return `${statuses.size} statuses selected`;
}

function upsertSummary(orders: InvitationOrderSummary[], summary: InvitationOrderSummary) {
  return orders.some((order) => order.id === summary.id) ? orders.map((order) => order.id === summary.id ? summary : order) : [summary, ...orders];
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

function formatCreatedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Indian/Mauritius" }).format(date);
}

function formatCreatedTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(date);
}

function formatPhone(phone: string) {
  return /^5\d{7}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4)}` : phone || "Not entered";
}

function initials(value: string) {
  return value.split(/\s+&\s+|\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase() || "PI";
}
