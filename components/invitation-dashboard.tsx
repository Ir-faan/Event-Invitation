"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  PackageCheck,
  PencilLine,
  Plus,
  RefreshCcw,
  Rocket,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { InvitationDesigner, type AdminInvitationOrder } from "@/components/invitation-designer";
import type { InvitationOrderStatus, InvitationOrderSummary } from "@/lib/invitation-orders";

type SortKey = "coupleName" | "customerName" | "eventDate" | "created_at" | "total_price" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" };
type RowAction = { id: string; action: "delete" | "deactivate" | "review" } | null;

const statusLabels: Record<InvitationOrderStatus, string> = {
  pending: "Need your review",
  active: "Currently live",
  inactive: "Previous order",
};

export function InvitationDashboard() {
  const [orders, setOrders] = useState<InvitationOrderSummary[]>([]);
  const [today, setToday] = useState("");
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
  const [deployOrder, setDeployOrder] = useState<InvitationOrderSummary | null>(null);
  const [deployUntil, setDeployUntil] = useState("");
  const [deploying, setDeploying] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const response = await fetch("/api/dashboard/orders", { cache: "no-store" });
      const data = await response.json() as { orders?: InvitationOrderSummary[]; today?: string; error?: string };
      if (!response.ok || !data.orders) throw new Error(data.error || "Orders could not be loaded.");
      setOrders(data.orders);
      setToday(data.today || new Date().toISOString().slice(0, 10));
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Orders could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOrders(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const counts = useMemo(() => ({
    pending: orders.filter((order) => order.status === "pending").length,
    active: orders.filter((order) => order.status === "active").length,
    inactive: orders.filter((order) => order.status === "inactive").length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return orders
      .filter((order) => activeStatuses.size === 0 || activeStatuses.has(order.status))
      .filter((order) => !query || [order.coupleName, order.customerName, order.phone, order.slug, order.id]
        .some((value) => value?.toLocaleLowerCase().includes(query)))
      .sort((a, b) => compareOrders(a, b, sort));
  }, [activeStatuses, orders, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);
  const visibleOrderValue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);

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
    setSort((current) => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: key === "created_at" || key === "total_price" ? "desc" : "asc" });
  }

  async function runRowAction(order: InvitationOrderSummary, action: "delete" | "deactivate" | "review") {
    const question = action === "delete"
      ? `Permanently delete the order for ${order.coupleName}? This cannot be undone.`
      : action === "deactivate"
        ? `Take ${order.coupleName}'s invitation offline?`
        : `Move ${order.coupleName}'s invitation back to Need your review?`;
    if (!window.confirm(question)) return;
    setRowAction({ id: order.id, action });
    setListError("");
    try {
      if (action === "delete") {
        const response = await fetch(`/api/dashboard/orders?id=${encodeURIComponent(order.id)}`, { method: "DELETE" });
        const data = await response.json() as { deleted?: boolean; error?: string };
        if (!response.ok || !data.deleted) throw new Error(data.error || "The order could not be deleted.");
        setOrders((current) => current.filter((item) => item.id !== order.id));
      } else {
        const response = await fetch("/api/dashboard/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: order.id, action }),
        });
        const data = await response.json() as { order?: AdminInvitationOrder; error?: string };
        if (!response.ok || !data.order) throw new Error(data.error || "The order could not be updated.");
        setOrders((current) => upsertSummary(current, data.order!.summary));
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : "The order could not be updated.");
    } finally {
      setRowAction(null);
    }
  }

  function openDeploy(order: InvitationOrderSummary) {
    const candidate = order.active_until || order.eventDate || today;
    setDeployUntil(candidate && candidate >= today ? candidate : today);
    setDeployOrder(order);
  }

  async function deployFromTable() {
    if (!deployOrder || !deployUntil) return;
    setDeploying(true);
    setListError("");
    try {
      const response = await fetch("/api/dashboard/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deployOrder.id, action: "deploy", activeUntil: deployUntil }),
      });
      const data = await response.json() as { order?: AdminInvitationOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "The invitation could not be deployed.");
      setOrders((current) => upsertSummary(current, data.order!.summary));
      setDeployOrder(null);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "The invitation could not be deployed.");
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
              <div><span>Order desk</span><h1>{filterHeading(activeStatuses)}</h1><p>{filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} in this view</p></div>
              <label className="orders-search"><Search aria-hidden="true" /><span className="sr-only">Search orders</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search names, phone or link…" /></label>
            </div>

            {listError && <DashboardError>{listError}</DashboardError>}
            {loading ? <DashboardLoading /> : filteredOrders.length ? (
              <>
                <div className="orders-table-scroll">
                  <table className="orders-datatable">
                    <thead><tr>
                      <SortableHeading label="Invitation" sortKey="coupleName" sort={sort} onSort={updateSort} />
                      <SortableHeading label="Customer" sortKey="customerName" sort={sort} onSort={updateSort} />
                      <SortableHeading label="Event date" sortKey="eventDate" sort={sort} onSort={updateSort} />
                      <SortableHeading label="Created" sortKey="created_at" sort={sort} onSort={updateSort} />
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
                        onDelete={() => void runRowAction(order, "delete")}
                        onDeactivate={() => void runRowAction(order, "deactivate")}
                        onReview={() => void runRowAction(order, "review")}
                      />
                    ))}</tbody>
                  </table>
                </div>
                <DataTableFooter count={filteredOrders.length} page={safePage} pageSize={pageSize} totalPages={totalPages} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
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
      {deployOrder && <DeployModal order={deployOrder} value={deployUntil} today={today} busy={deploying} onValue={setDeployUntil} onClose={() => !deploying && setDeployOrder(null)} onDeploy={() => void deployFromTable()} />}
    </main>
  );
}

function DashboardHeader({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <header className="orders-header">
      <Link className="orders-brand" href="/dashboard" aria-label="Paperless Invites dashboard"><span>PI</span><div><strong>Paperless Invites</strong><small>Private dashboard</small></div></Link>
      <div className="orders-header-actions">
        <Link href="/design-invitation"><Plus aria-hidden="true" /> Create invitation</Link>
        <button type="button" onClick={onRefresh} disabled={loading}><RefreshCcw className={loading ? "is-spinning" : ""} aria-hidden="true" /> Refresh</button>
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

function OrderRow({ order, busy, onOpen, onDeploy, onDelete, onDeactivate, onReview }: {
  order: InvitationOrderSummary;
  busy: boolean;
  onOpen: () => void;
  onDeploy: () => void;
  onDelete: () => void;
  onDeactivate: () => void;
  onReview: () => void;
}) {
  return (
    <tr>
      <td><span className="orders-invitation-cell"><i>{initials(order.coupleName)}</i><span><strong>{order.coupleName}</strong><small>{order.slug ? `/${order.slug}` : `Order ${order.id.slice(0, 8)}`}</small></span></span></td>
      <td><span className="orders-cell-stack"><strong>{order.customerName}</strong><small>{formatPhone(order.phone)}</small></span></td>
      <td><span className="orders-cell-stack"><strong>{formatDate(order.eventDate)}</strong><small>{order.sectionCount} invitation parts</small></span></td>
      <td><span className="orders-cell-stack"><strong>{formatCreatedDate(order.created_at)}</strong><small>{formatCreatedTime(order.created_at)}</small></span></td>
      <td><strong>{formatMoney(order.total_price)}</strong></td>
      <td><span className="orders-cell-stack"><StatusChip status={order.status} />{order.status === "active" && <small>Until {formatDate(order.active_until)}</small>}</span></td>
      <td><div className="orders-row-actions">
        <button type="button" title="Edit and preview" aria-label={`Edit and preview ${order.coupleName}`} onClick={onOpen} disabled={busy}><PencilLine /></button>
        {order.status === "active" && order.slug && <a href={`/${order.slug}`} target="_blank" rel="noreferrer" title="Open live invitation" aria-label={`Open ${order.coupleName}'s live invitation`}><ExternalLink /></a>}
        {order.status !== "active" && <button type="button" title="Deploy invitation" aria-label={`Deploy ${order.coupleName}`} onClick={onDeploy} disabled={busy}><Rocket /></button>}
        {order.status === "active" && <button type="button" title="Undeploy to Previous orders" aria-label={`Take ${order.coupleName} offline`} onClick={onDeactivate} disabled={busy}>{busy ? <Loader2 className="is-spinning" /> : <Archive />}</button>}
        {order.status !== "pending" && <button type="button" title="Move to Need your review" aria-label={`Move ${order.coupleName} to review`} onClick={onReview} disabled={busy}><RotateCcw /></button>}
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

function DeployModal({ order, value, today, busy, onValue, onClose, onDeploy }: { order: InvitationOrderSummary; value: string; today: string; busy: boolean; onValue: (value: string) => void; onClose: () => void; onDeploy: () => void }) {
  return (
    <div className="orders-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="orders-deploy-modal" role="dialog" aria-modal="true" aria-labelledby="orders-deploy-title">
        <span><Rocket aria-hidden="true" /></span><p>Publish invitation</p><h2 id="orders-deploy-title">Make {order.coupleName} live</h2>
        <label><span>Keep the invitation active until</span><input type="date" min={today} value={value} onChange={(event) => onValue(event.target.value)} /></label>
        <div><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button type="button" onClick={onDeploy} disabled={busy || !value}>{busy ? <Loader2 className="is-spinning" /> : <Rocket />} Deploy invitation</button></div>
      </section>
    </div>
  );
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

function compareOrders(a: InvitationOrderSummary, b: InvitationOrderSummary, sort: SortState) {
  const statusRank: Record<InvitationOrderStatus, number> = { pending: 0, active: 1, inactive: 2 };
  const value = (order: InvitationOrderSummary): string | number => sort.key === "status" ? statusRank[order.status] : order[sort.key];
  const left = value(a);
  const right = value(b);
  const result = typeof left === "number" && typeof right === "number" ? left - right : String(left ?? "").localeCompare(String(right ?? ""), "en", { numeric: true, sensitivity: "base" });
  return sort.direction === "asc" ? result : -result;
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
