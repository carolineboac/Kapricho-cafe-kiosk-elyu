import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { 
  Coffee, 
  Utensils, 
  Pizza as PizzaIcon, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Printer, 
  ChevronRight,
  Milk,
  Sandwich,
  Soup,
  Sparkles,
  Check,
  Settings,
  BarChart3,
  History,
  Package,
  LogOut,
  Trash2,
  Save,
  Image as ImageIcon,
  ShieldAlert,
  Database as DatabaseIcon,
  Boxes,
  ArrowLeftCircle,
  ArchiveRestoreIcon,
  Bell,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  Loader2,
  Pencil
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line, 
  PieChart,
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { MenuItem, Category, AddOn, CartItem, MenuData, Ingredient, RecipeIngredient } from './types';

// ─────────────────────────────────────────────────────────────
// CUSTOM DIALOGS — pamalit sa alert() / confirm() / prompt() ng browser
// Lumalabas sa GITNA ng screen (ang native dialog ay laging nasa taas).
// ─────────────────────────────────────────────────────────────
type DialogRequest =
  | { kind: 'alert'; message: string; title?: string; resolve: () => void }
  | { kind: 'confirm'; message: string; title?: string; confirmText: string; danger: boolean; resolve: (v: boolean) => void }
  | { kind: 'prompt'; message: string; title?: string; defaultValue: string; inputType: 'text' | 'number'; resolve: (v: string | null) => void };

let enqueueDialog: ((d: DialogRequest) => void) | null = null;

function uiAlert(message: string, opts: { title?: string } = {}): Promise<void> {
  return new Promise(resolve => {
    if (!enqueueDialog) { window.alert(message); resolve(); return; }
    enqueueDialog({ kind: 'alert', message, title: opts.title, resolve });
  });
}

function uiConfirm(
  message: string,
  opts: { title?: string; confirmText?: string; danger?: boolean } = {}
): Promise<boolean> {
  return new Promise(resolve => {
    if (!enqueueDialog) { resolve(window.confirm(message)); return; }
    enqueueDialog({
      kind: 'confirm',
      message,
      title: opts.title,
      confirmText: opts.confirmText || 'OK',
      danger: !!opts.danger,
      resolve
    });
  });
}

function uiPrompt(
  message: string,
  opts: { title?: string; defaultValue?: string; inputType?: 'text' | 'number' } = {}
): Promise<string | null> {
  return new Promise(resolve => {
    if (!enqueueDialog) { resolve(window.prompt(message, opts.defaultValue || '')); return; }
    enqueueDialog({
      kind: 'prompt',
      message,
      title: opts.title,
      defaultValue: opts.defaultValue || '',
      inputType: opts.inputType || 'text',
      resolve
    });
  });
}

let dialogIdCounter = 0;

function DialogHost() {
  const [queue, setQueue] = useState<(DialogRequest & { id: number })[]>([]);

  useEffect(() => {
    enqueueDialog = d => setQueue(q => [...q, { ...d, id: ++dialogIdCounter }]);
    return () => { enqueueDialog = null; };
  }, []);

  const current = queue[0];
  if (!current) return null;

  const close = (value?: any) => {
    (current.resolve as (v?: any) => void)(value);
    setQueue(q => q.slice(1));
  };

  return <DialogCard key={current.id} dialog={current} onClose={close} />;
}

function DialogCard({ dialog, onClose }: { dialog: DialogRequest; onClose: (value?: any) => void }) {
  const [text, setText] = useState(dialog.kind === 'prompt' ? dialog.defaultValue : '');

  const cancelValue = dialog.kind === 'confirm' ? false : dialog.kind === 'prompt' ? null : undefined;
  const okValue = dialog.kind === 'confirm' ? true : dialog.kind === 'prompt' ? text : undefined;

  // Esc = cancel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(cancelValue);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const title =
    dialog.title ||
    (dialog.kind === 'alert' ? 'Notice' : dialog.kind === 'confirm' ? 'Please confirm' : 'Enter a value');
  const danger = dialog.kind === 'confirm' && dialog.danger;
  const okLabel = dialog.kind === 'confirm' ? dialog.confirmText : 'OK';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
      onMouseDown={e => {
        // click sa labas ng card = cancel (hindi para sa alert, para hindi aksidenteng ma-skip)
        if (e.target === e.currentTarget && dialog.kind !== 'alert') onClose(cancelValue);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center space-y-6"
      >
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-stone-900">{title}</h3>
          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{dialog.message}</p>
        </div>

        {dialog.kind === 'prompt' && (
          <input
            autoFocus
            type={dialog.inputType}
            step={dialog.inputType === 'number' ? 'any' : undefined}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onClose(text); }}
            className="w-full px-4 py-2 rounded-xl border border-stone-200 text-center focus:outline-none focus:border-primary"
          />
        )}

        <div className="flex gap-3">
          {dialog.kind !== 'alert' && (
            <button
              autoFocus={danger}
              onClick={() => onClose(cancelValue)}
              className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            autoFocus={dialog.kind === 'alert' || dialog.kind === 'confirm' && !danger}
            onClick={() => onClose(okValue)}
            className={
              danger
                ? 'flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 active:scale-95 transition-all'
                : 'flex-1 btn-primary'
            }
          >
            {okLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin();
      } else {
        setError(data.error || 'Invalid username or password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-stone-100 w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white font-serif text-2xl font-bold mx-auto">K</div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Kapricho</h1>
          <p className="text-stone-500 text-sm">Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase mb-1 block" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase mb-1 block" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🔔 LOW STOCK NOTIFICATION BELL
// ─────────────────────────────────────────────────────────────
function LowStockNotification({ onGoToInventory }: { onGoToInventory: () => void }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/admin/ingredients');
      const data = await res.json();
      setIngredients(data);
    } catch {
      // ignore network errors, susubukan ulit sa susunod na refresh
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
    const interval = setInterval(fetchIngredients, 30000);
    return () => clearInterval(interval);
  }, []);

  const lowItems = ingredients
    .filter(i => i.stock_quantity <= i.low_stock_threshold)
    .sort((a, b) => a.stock_quantity - b.stock_quantity);

  const outOfStockCount = lowItems.filter(i => i.stock_quantity <= 0).length;
  const hasAlerts = lowItems.length > 0;

  return (
    <div
      className={`rounded-3xl shadow-sm border overflow-hidden ${
        hasAlerts ? 'bg-white border-red-200' : 'bg-white border-stone-100'
      }`}
    >
      {/* Header with bell */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                hasAlerts ? 'bg-red-50 text-red-500' : 'bg-stone-100 text-stone-400'
              }`}
            >
              <Bell className={`w-6 h-6 ${hasAlerts ? 'animate-pulse' : ''}`} />
            </div>
            {hasAlerts && (
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                {lowItems.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Inventory Alerts</h3>
            <p className={`text-sm ${hasAlerts ? 'text-red-500 font-medium' : 'text-stone-500'}`}>
              {loading
                ? 'Checking stock...'
                : hasAlerts
                ? `${lowItems.length} ingredient(s) low on stock${
                    outOfStockCount > 0 ? ` • ${outOfStockCount} out of stock` : ''
                  }`
                : 'All ingredients are sufficiently stocked ✓'}
            </p>
          </div>
        </div>
        {hasAlerts && (open ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />)}
      </button>

      {/* Low stock list */}
      {hasAlerts && open && (
        <div className="border-t border-stone-100 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {lowItems.map(ing => {
              const isOut = ing.stock_quantity <= 0;
              return (
                <div
                  key={ing.id}
                  className={`p-4 rounded-2xl border ${
                    isOut ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-stone-800 text-sm">{ing.name}</p>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isOut ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {isOut ? 'Out of stock' : 'Low stock'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 font-bold ${isOut ? 'text-red-600' : 'text-amber-700'}`}>
                    {ing.stock_quantity.toLocaleString()} {ing.unit} left
                  </p>
                  <p className="text-xs text-stone-500">
                    Alert level: {ing.low_stock_threshold.toLocaleString()} {ing.unit}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={onGoToInventory}
            className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
          >
            <Boxes className="w-4 h-4" />
            Go to Inventory to restock
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PIE CHART — Sales share per product
// ─────────────────────────────────────────────────────────────
function ProductSalesPie() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports/sales-by-product?period=daily')
      .then(res => res.json())
      .then((report: Record<string, Record<string, { qty: number; revenue: number }>>) => {
        const totals: Record<string, number> = {};
        Object.values(report).forEach(dayData => {
          Object.entries(dayData).forEach(([name, d]) => {
            totals[name] = (totals[name] || 0) + d.qty;
          });
        });
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 6).map(([name, value]) => ({ name, value }));
        const restTotal = sorted.slice(6).reduce((sum, [, v]) => sum + v, 0);
        if (restTotal > 0) top.push({ name: 'Others', value: restTotal });
        setData(top);
        setLoading(false);
      });
  }, []);

  const COLORS = ['#5A5A40', '#D4A373', '#A47148', '#8B5E34', '#C9ADA7', '#9C6644', '#B08968'];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
      <h3 className="text-lg font-bold mb-6">Sales by Product</h3>
      <div className="h-80">
        {loading ? (
          <p className="text-stone-400 text-sm">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-stone-400 text-sm">No sales data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name} ${((value / total) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}x (${((value / total) * 100).toFixed(1)}%)`,
                  name
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRINT / PDF — sales report lang ang lalabas (walang sidebar, charts, o ibang parte ng dashboard)
// Naka-hide sa screen; kapag nagpi-print lang ito lumalabas (ang .printing-report class ay nilalagay ng Print button)
// ─────────────────────────────────────────────────────────────
type SalesReportData = Record<string, Record<string, { qty: number; revenue: number }>>;

function reportPeriodTitle(period: 'daily' | 'weekly' | 'monthly') {
  if (period === 'weekly') return 'Weekly — last 12 weeks (week starts on Sunday)';
  if (period === 'monthly') return 'Monthly — last 12 months';
  return 'Daily — last 30 days';
}

function reportGroupLabel(period: 'daily' | 'weekly' | 'monthly', key: string) {
  if (period === 'weekly') return `Week of ${key}`;
  if (period === 'monthly') {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  return key;
}

function SalesReportPrint({
  period,
  report,
  dates
}: {
  period: 'daily' | 'weekly' | 'monthly';
  report: SalesReportData;
  dates: string[];
}) {
  let grandQty = 0;
  let grandRevenue = 0;
  const groups = dates.map(date => {
    const products = Object.entries(report[date]).sort((a, b) => b[1].qty - a[1].qty);
    const qty = products.reduce((s, [, d]) => s + d.qty, 0);
    const revenue = products.reduce((s, [, d]) => s + d.revenue, 0);
    grandQty += qty;
    grandRevenue += revenue;
    return { date, products, qty, revenue };
  });

  const peso = (n: number) => `₱${n.toLocaleString()}`;

  return (
    <div className="report-print-root">
      <style>{`
        .report-print-root { display: none; }
        @media print {
          body.printing-report #root { display: none !important; }
          body.printing-report { background: #fff !important; }
          body.printing-report .report-print-root { display: block !important; color: #000; font-size: 12px; padding: 4px; }
        }
        .rp-head { text-align: center; margin-bottom: 18px; }
        .rp-brand { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
        .rp-title { font-size: 15px; font-weight: 700; margin-top: 2px; }
        .rp-meta { font-size: 11px; color: #555; margin-top: 2px; }
        .rp-group { break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px; }
        .rp-group-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
        .rp-table { width: 100%; border-collapse: collapse; }
        .rp-table th { text-align: left; font-size: 10px; text-transform: uppercase; color: #555; border-bottom: 1px solid #000; padding: 4px 6px; }
        .rp-table td { border-bottom: 1px solid #ddd; padding: 4px 6px; }
        .rp-table .num { text-align: right; white-space: nowrap; }
        .rp-table .sub td { font-weight: 700; border-bottom: 1px solid #000; }
        .rp-grand { display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; font-size: 14px; font-weight: 700; }
      `}</style>

      <div className="rp-head">
        <div className="rp-brand">Kapricho</div>
        <div className="rp-title">Sales per Product Report</div>
        <div className="rp-meta">{reportPeriodTitle(period)}</div>
        <div className="rp-meta">Generated: {new Date().toLocaleString()}</div>
      </div>

      {groups.map(g => (
        <div key={g.date} className="rp-group">
          <div className="rp-group-title">{reportGroupLabel(period, g.date)}</div>
          <table className="rp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Qty Sold</th>
                <th className="num">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {g.products.map(([name, d]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td className="num">{d.qty}</td>
                  <td className="num">{peso(d.revenue)}</td>
                </tr>
              ))}
              <tr className="sub">
                <td>Subtotal</td>
                <td className="num">{g.qty}</td>
                <td className="num">{peso(g.revenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <div className="rp-grand">
        <span>GRAND TOTAL — {grandQty.toLocaleString()} item(s)</span>
        <span>{peso(grandRevenue)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SALES PER PRODUCT (daily / weekly / monthly)
// ─────────────────────────────────────────────────────────────
function SalesByProductTable({ search = '' }: { search?: string }) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [report, setReport] = useState<Record<string, Record<string, { qty: number; revenue: number }>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reports/sales-by-product?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      });
  }, [period]);

  const dates = Object.keys(report).sort((a, b) => (a < b ? 1 : -1));

  const [exporting, setExporting] = useState(false);
  const hasData = !loading && dates.length > 0;

  // PDF: sales report lang ang ipi-print (tingnan ang SalesReportPrint)
  const handlePrint = () => {
    document.body.classList.add('printing-report');
    const cleanup = () => {
      document.body.classList.remove('printing-report');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  // Excel: dina-download ang .xlsx galing sa server (Sales per Product + Orders)
  const handleExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/reports/export-xlsx?period=${period}`);
      const type = res.headers.get('content-type') || '';

      if (!res.ok || !type.includes('spreadsheetml')) {
        let message =
          'The server does not have the Excel export yet.\n\nPlease replace server.ts with the latest version, run npm install, then restart the server (npm run dev).';
        if (type.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (data?.error) message = data.error;
        }
        await uiAlert(message, { title: 'Could not export' });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `kapricho-sales-${period}-${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      await uiAlert('Cannot reach the server. Please check that the app is still running, then try again.', { title: 'Connection problem' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 no-print-hide">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="text-lg font-bold">Sales per Product</h3>
        <div className="flex flex-wrap gap-2 items-center">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                period === p ? 'bg-primary text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={handlePrint}
            disabled={!hasData}
            className="px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Print / PDF
          </button>
          <button
            onClick={handleExcel}
            disabled={!hasData || exporting}
            className="px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting...' : 'Excel'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading...</p>
      ) : dates.length === 0 ? (
        <p className="text-stone-400 text-sm">No sales data for this period.</p>
      ) : (
        <div className="space-y-6 max-h-[28rem] overflow-y-auto pr-2">
          {dates.map(date => {
            const products = Object.entries(report[date])
              .filter(([name]) => name.toLowerCase().includes(search.trim().toLowerCase()))
              .sort((a, b) => b[1].qty - a[1].qty);
            return (
              <div key={date}>
                <p className="text-xs font-bold text-stone-400 uppercase mb-2">{date}</p>
                <table className="w-full text-sm">
                  <tbody>
                    {products.map(([name, data], idx) => (
                      <tr key={name} className="border-b border-stone-50">
                        <td className="py-2">
                          {idx === 0 && <span className="mr-2">🔥</span>}
                          {name}
                        </td>
                        <td className="py-2 text-right font-bold">{data.qty}x</td>
                        <td className="py-2 text-right text-stone-500 w-24">₱{data.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Naka-hide sa screen; ito lang ang lalabas kapag nag-print / PDF */}
      {createPortal(<SalesReportPrint period={period} report={report} dates={dates} />, document.body)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INVENTORY / "GRAMS" STOCK TRACKING
// ─────────────────────────────────────────────────────────────
function InventoryTab() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientPage, setIngredientPage] = useState(1);
  const INGREDIENTS_PAGE_SIZE = 25;
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'g', stock_quantity: 0, low_stock_threshold: 100 });
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [stockNotice, setStockNotice] = useState<{ name: string; amount: number } | null>(null);
  const [ingredientSuccess, setIngredientSuccess] = useState<string | null>(null);
  const [deletingIngredientId, setDeletingIngredientId] = useState<string | null>(null);

  const fetchIngredients = async () => {
    const res = await fetch('/api/admin/ingredients');
    setIngredients(await res.json());
  };

  useEffect(() => { fetchIngredients(); }, []);

  useEffect(() => {
    setIngredientPage(1);
  }, [ingredientSearch]);

  useEffect(() => {
    if (!stockNotice) return;
    const timer = setTimeout(() => setStockNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [stockNotice]);

  useEffect(() => {
    if (!deletingIngredientId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeletingIngredientId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deletingIngredientId]);

  useEffect(() => {
    if (!ingredientSuccess) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIngredientSuccess(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ingredientSuccess]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name.trim()) return;
    const res = await fetch('/api/admin/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIngredient)
    });
    if (res.ok) {
      setNewIngredient({ name: '', unit: 'g', stock_quantity: 0, low_stock_threshold: 100 });
      await fetchIngredients();
      setIngredientSuccess('Ingredient added successfully.');
    } else {
      const data = await res.json().catch(() => ({}));
      await uiAlert(data?.error || 'Failed to add ingredient.', { title: 'Error' });
    }
  };

  const handleRestock = (id: string) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return;
    setAdjustingIngredient(ing);
    setAdjustAmount('');
  };

  const handleAdjustSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!adjustingIngredient) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount)) return;
    const res = await fetch(`/api/admin/ingredients/${adjustingIngredient.id}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      await uiAlert(data?.error || 'Could not adjust stock.', { title: 'Could not adjust' });
      return;
    }
    const adjustedName = adjustingIngredient.name;
    await fetchIngredients();
    setAdjustingIngredient(null);
    setAdjustAmount('');
    setStockNotice({ name: adjustedName, amount });
  };

  const handleDelete = (id: string) => {
    setDeletingIngredientId(id);
  };

  const confirmDeleteIngredient = async () => {
    if (!deletingIngredientId) return;
    const id = deletingIngredientId;
    const res = await fetch(`/api/admin/ingredients/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeletingIngredientId(null);
      await fetchIngredients();
      setIngredientSuccess('Ingredient deleted successfully.');
    } else {
      const data = await res.json().catch(() => ({}));
      setDeletingIngredientId(null);
      await uiAlert(data?.error || 'Failed to delete ingredient.', { title: 'Error' });
    }
  };

  const lowStockCount = ingredients.filter(i => i.stock_quantity <= i.low_stock_threshold).length;

  // May alert (low / out of stock) ang mauuna; pinakakritikal muna. Ang iba ay alphabetical.
  const isAlert = (i: Ingredient) => i.stock_quantity <= i.low_stock_threshold;
  const urgency = (i: Ingredient) => (i.low_stock_threshold > 0 ? i.stock_quantity / i.low_stock_threshold : i.stock_quantity);
  const sortedIngredients = [...ingredients].sort((x, y) => {
    const ax = isAlert(x), ay = isAlert(y);
    if (ax !== ay) return ax ? -1 : 1;
    if (ax && ay && urgency(x) !== urgency(y)) return urgency(x) - urgency(y);
    return x.name.localeCompare(y.name);
  });

  const filteredIngredients = sortedIngredients.filter((ing: Ingredient) => {
    const q = ingredientSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      ing.name.toLowerCase().includes(q) ||
      ing.unit.toLowerCase().includes(q) ||
      String(ing.stock_quantity).toLowerCase().includes(q)
    );
  });

  const totalIngredientRecords = filteredIngredients.length;
  const totalIngredientPages = Math.max(1, Math.ceil(totalIngredientRecords / INGREDIENTS_PAGE_SIZE));
  const safeIngredientPage = Math.min(ingredientPage, totalIngredientPages);
  const ingredientStartIndex = totalIngredientRecords === 0 ? 0 : (safeIngredientPage - 1) * INGREDIENTS_PAGE_SIZE;
  const ingredientEndIndex = Math.min(ingredientStartIndex + INGREDIENTS_PAGE_SIZE, totalIngredientRecords);
  const pagedIngredients = filteredIngredients.slice(ingredientStartIndex, ingredientEndIndex);

  useEffect(() => {
    if (ingredientPage > totalIngredientPages) setIngredientPage(totalIngredientPages);
  }, [ingredientPage, totalIngredientPages]);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-serif font-bold text-stone-900">Inventory</h2>
        <p className="text-stone-500">
          Real-time stock of the ingredients (g / kg / ml / pcs).
          {lowStockCount > 0 && (
            <span className="ml-2 text-red-500 font-bold">⚠️ {lowStockCount} item(s) is out of stock!</span>
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4 h-fit">
          <h3 className="text-lg font-bold mb-2">Add Ingredient</h3>
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Name</label>
            <input
              required
              placeholder="e.g. Coffee Beans"
              value={newIngredient.name}
              onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Starting Stock</label>
              <input
                type="number"
                step="any"
                value={newIngredient.stock_quantity}
                onChange={e => setNewIngredient({ ...newIngredient, stock_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Unit</label>
              <select
                value={newIngredient.unit}
                onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary bg-white"
              >
                <option value="g">grams (g)</option>
                <option value="kg">kilograms (kg)</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Low Stock Alert (kapag umabot dito)</label>
            <input
              type="number"
              step="any"
              value={newIngredient.low_stock_threshold}
              onChange={e => setNewIngredient({ ...newIngredient, low_stock_threshold: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
            />
          </div>
          <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </form>

        <div className="lg:col-span-2 space-y-3">
          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={ingredientSearch}
                onChange={e => setIngredientSearch(e.target.value)}
                placeholder="Search ingredients by name, unit, or stock..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary text-sm"
                aria-label="Search ingredients"
              />
            </div>
          </div>

          {stockNotice && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-green-200 bg-green-50 text-green-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium">
                  Stock adjusted: {stockNotice.amount} for {stockNotice.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockNotice(null)}
                aria-label="Dismiss notification"
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {ingredients.length === 0 && (
            <p className="text-stone-400 text-sm p-6 bg-white rounded-2xl border border-stone-100">
              No ingredients yet. Add using the form on the left.
            </p>
          )}
          {ingredients.length > 0 && pagedIngredients.length === 0 && (
            <p className="text-stone-400 text-sm p-6 bg-white rounded-2xl border border-stone-100">
              No ingredients match your search.
            </p>
          )}
          {pagedIngredients.map(ing => {
            const isLow = ing.stock_quantity <= ing.low_stock_threshold;
            return (
              <div
                key={ing.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isLow ? 'border-red-200 bg-red-50' : 'bg-white border-stone-100'
                }`}
              >
                <div>
                  <p className="font-bold text-stone-800">{ing.name}</p>
                  <p className={`text-sm ${isLow ? 'text-red-500 font-bold' : 'text-stone-500'}`}>
                    {ing.stock_quantity.toLocaleString()} {ing.unit} left
                    {isLow && ' — Low, restock now!'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRestock(ing.id)} className="btn-primary text-xs px-4 py-2">
                    Adjust Stock
                  </button>
                  <button onClick={() => handleDelete(ing.id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {ingredients.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-2">
              <p className="text-xs text-stone-500">
                {totalIngredientRecords === 0
                  ? 'No records'
                  : `Showing ${ingredientStartIndex + 1}–${ingredientEndIndex} of ${totalIngredientRecords} records`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIngredientPage(p => Math.max(1, p - 1))}
                  disabled={safeIngredientPage <= 1}
                  aria-label="Previous page"
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                {Array.from({ length: totalIngredientPages }, (_, i) => i + 1)
                  .filter(p => {
                    if (totalIngredientPages <= 7) return true;
                    if (p === 1 || p === totalIngredientPages) return true;
                    if (Math.abs(p - safeIngredientPage) <= 1) return true;
                    return false;
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis && <span className="px-2 text-stone-400">…</span>}
                        <button
                          onClick={() => setIngredientPage(p)}
                          className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-medium border ${
                            p === safeIngredientPage
                              ? 'bg-primary text-white border-primary'
                              : 'border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
                <button
                  onClick={() => setIngredientPage(p => Math.min(totalIngredientPages, p + 1))}
                  disabled={safeIngredientPage >= totalIngredientPages}
                  aria-label="Next page"
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock adjustment popup modal */}
      {adjustingIngredient && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setAdjustingIngredient(null);
              setAdjustAmount('');
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-stone-900">Adjust Stock</h3>
              <p className="text-sm text-stone-600">
                {adjustingIngredient.name} — current: {adjustingIngredient.stock_quantity.toLocaleString()} {adjustingIngredient.unit}
              </p>
            </div>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">
                  Amount to add (negative to subtract)
                </label>
                <input
                  autoFocus
                  type="number"
                  step="any"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-center focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustingIngredient(null);
                    setAdjustAmount('');
                  }}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ingredientSuccess && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setIngredientSuccess(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ingredient-success-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 text-center">
            <div className="space-y-2">
              <h3 id="ingredient-success-title" className="text-xl font-bold text-stone-900">Success</h3>
              <p className="text-sm text-stone-600">{ingredientSuccess}</p>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => setIngredientSuccess(null)}
              className="w-full btn-primary"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {deletingIngredientId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setDeletingIngredientId(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-ingredient-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6">
            <div className="space-y-2">
              <h3 id="delete-ingredient-title" className="text-xl font-bold text-stone-900">Delete ingredient</h3>
              <p className="text-sm text-stone-600">Are you sure you want to delete this ingredient?</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setDeletingIngredientId(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteIngredient}
                className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RECIPE MODAL — i-link ang isang product sa mga ingredients nito
// ─────────────────────────────────────────────────────────────
function RecipeModal({
  item,
  ingredients,
  onClose
}: {
  item: MenuItem;
  ingredients: Ingredient[];
  onClose: () => void;
}) {
  const [recipe, setRecipe] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRecipeSuccess, setShowRecipeSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/products/${item.id}/recipe`)
      .then(res => res.json())
      .then((data: RecipeIngredient[]) => {
        const map: Record<string, number> = {};
        data.forEach(r => { map[r.ingredient_id] = r.amount_used; });
        setRecipe(map);
        setLoading(false);
      });
  }, [item.id]);

  useEffect(() => {
    if (!showConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setShowConfirm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showConfirm, saving]);

  const performSave = async () => {
    const payload = Object.entries(recipe)
      .filter(([, amount]) => amount > 0)
      .map(([ingredient_id, amount_used]) => ({ ingredient_id, amount_used }));

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${item.id}/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: payload })
      });
      if (res.ok) {
        setShowConfirm(false);
        setShowRecipeSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        await uiAlert(data?.error || 'Could not save the recipe.', { title: 'Could not save' });
      }
    } catch {
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-stone-900">Recipe: {item.name}</h3>
          <p className="text-sm text-stone-500">
            Enter how many grams/ml of each ingredient is used in every 1 order of this product.
            This is what will be deducted from the inventory whenever there is a new order.
          </p>
        </div>

        {loading ? (
          <p className="text-stone-400 text-sm">Loading...</p>
        ) : ingredients.length === 0 ? (
          <p className="text-stone-400 text-sm">
            you don't have any ingredients yet. Add them to the inventory tab first.
          </p>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  placeholder="Search ingredients..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary text-sm"
                  aria-label="Search recipe ingredients"
                />
              </div>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {ingredients
                .filter(ing => ing.name.toLowerCase().includes(recipeSearch.trim().toLowerCase()))
                .map(ing => (
              <div key={ing.id} className="flex items-center justify-between gap-3">
                <label className="text-sm text-stone-700 flex-1">{ing.name} ({ing.unit === 'kg' ? 'g — stock is in kg' : ing.unit})</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={recipe[ing.id] || ''}
                  onChange={e =>
                    setRecipe({ ...recipe, [ing.id]: parseFloat(e.target.value) || 0 })
                  }
                  className="w-24 px-3 py-2 rounded-xl border border-stone-200 text-right"
                />
              </div>
            ))}
          </div>
          </>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={saving}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Recipe
          </button>
        </div>
      </div>
    </div>

    {showRecipeSuccess && (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onMouseDown={e => {
          if (e.target === e.currentTarget) {
            setShowRecipeSuccess(false);
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-success-title"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h3 id="recipe-success-title" className="text-xl font-bold text-stone-900">Success</h3>
            <p className="text-sm text-stone-600">Recipe saved successfully.</p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => {
              setShowRecipeSuccess(false);
              onClose();
            }}
            className="w-full btn-primary"
          >
            OK
          </button>
        </div>
      </div>
    )}

    {showConfirm && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onMouseDown={e => {
          if (e.target === e.currentTarget && !saving) setShowConfirm(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-recipe-title"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
          <div className="space-y-2">
            <h3 id="confirm-recipe-title" className="text-xl font-bold text-stone-900">Confirm Recipe</h3>
            <p className="text-sm text-stone-600">
              Save recipe for <strong>{item.name}</strong> with the following ingredients?
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {Object.entries(recipe)
              .filter(([, amount]) => amount > 0)
              .map(([ingredient_id, amount_used]) => {
                const ing = ingredients.find(i => i.id === ingredient_id);
                return (
                  <div key={ingredient_id} className="flex justify-between text-sm">
                    <span className="text-stone-700">{ing?.name || ingredient_id}</span>
                    <span className="font-bold text-stone-900">{amount_used} {ing?.unit || ''}</span>
                  </div>
                );
              })}
            {Object.entries(recipe).filter(([, amount]) => amount > 0).length === 0 && (
              <p className="text-sm text-stone-400">No ingredients selected.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { if (!saving) setShowConfirm(false); }}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={performSave}
              disabled={saving}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MAINTENANCE — Archive first before permanently delete (30 days)
// ─────────────────────────────────────────────────────────────
function MaintenanceTab() {
  const [archived, setArchived] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const fetchArchived = async () => {
    const res = await fetch('/api/admin/maintenance/archive');
    setArchived(await res.json());
  };

  const fetchActive = async () => {
    const res = await fetch('/api/admin/orders');
    setActiveOrders(await res.json());
  };

  const refresh = async () => {
    await Promise.all([fetchArchived(), fetchActive()]);
  };

  useEffect(() => { refresh(); }, []);

  // "2x Cafe Latte, 1x Americano" — para makita kung anong products ang laman ng order
  const summarize = (itemsJson: string) => {
    try {
      const items = JSON.parse(itemsJson);
      return items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ');
    } catch {
      return '—';
    }
  };

  const toggleOne = (id: number) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const allSelected = activeOrders.length > 0 && selected.length === activeOrders.length;
  const toggleAll = () => {
    setSelected(allSelected ? [] : activeOrders.map(o => o.id));
  };

  const handleArchiveSelected = async () => {
    if (selected.length === 0) return;
    const ok = await uiConfirm(
      `Are you sure you want to archive ${selected.length} selected order(s)?\n\n` +
      `They will remain in the Archive for 30 days and can still be restored. After 30 days, they will be permanently deleted.`,
      { title: 'Archive orders', confirmText: 'Archive', danger: true }
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch('/api/admin/maintenance/archive-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });

      let data: any = null;
      try { data = await res.json(); } catch { /* hindi JSON ang sagot ng server */ }

      if (res.ok && data?.success) {
        setSelected([]);
        await refresh();
        await uiAlert(data.message, { title: 'Done' });
      } else if (!data) {
        await uiAlert(
          res.status === 404
            ? 'The server does not have the "archive selected" feature yet.\n\nPlease replace server.ts with the latest version, then restart the server (npm run dev).'
            : `The server returned an error (${res.status}). Please check the terminal for details.`,
          { title: 'Could not archive' }
        );
      } else {
        await uiAlert(data.error || 'Could not archive the selected orders.', { title: 'Could not archive' });
      }
    } catch {
      await uiAlert('Cannot reach the server. Please check that the app is still running, then try again.', { title: 'Connection problem' });
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id: number) => {
    const ok = await uiConfirm('Are you sure you want to restore this archived order?', { title: 'Restore order', confirmText: 'Restore' });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/maintenance/archive/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        await refresh();
        await uiAlert('Order restored successfully.', { title: 'Done' });
      } else {
        const data = await res.json().catch(() => ({}));
        await uiAlert(data?.error || 'Could not restore the order.', { title: 'Could not restore' });
      }
    } catch {
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteArchived = async (id: number) => {
    const ok = await uiConfirm('Permanently delete this archived order? This cannot be undone.', { title: 'Delete order', confirmText: 'Delete', danger: true });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/maintenance/archive/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refresh();
        await uiAlert('Archived order permanently deleted.', { title: 'Done' });
      } else {
        const data = await res.json().catch(() => ({}));
        await uiAlert(data?.error || 'Could not delete the archived order.', { title: 'Could not delete' });
      }
    } catch {
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-serif font-bold text-stone-900">System Maintenance</h2>
        <p className="text-stone-500">Archive before permanently delete — 30 days period</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-4 text-amber-600">
            <DatabaseIcon className="w-8 h-8" />
            <h3 className="text-xl font-bold">Order History</h3>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Note:</strong> Orders you archive <strong>will not be permanently deleted immediately</strong>.
              They will remain in the Archive for 30 days, with the option to restore. After 30 days, they will automatically be permanently deleted by the system.
            </p>
          </div>

          <p className="text-sm text-stone-500">
            Select only the orders you want to archive from the list below.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-4 text-stone-600">
            <Package className="w-8 h-8" />
            <h3 className="text-xl font-bold">Storage Info</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Database</span>
              <span className="font-mono font-bold">SQLite</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Image Folder</span>
              <span className="font-mono font-bold">/images</span>
            </div>
          </div>

          <p className="text-xs text-stone-400 italic">
            Tip: To back up your data, run <span className="font-mono">pg_dump</span> against your SQLite database, and also copy the <span className="font-mono">/images</span> folder.
          </p>
        </div>
      </div>

      {/* Active orders — pumili ng specific na i-aarchive */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-lg">
            Active Orders ({activeOrders.length})
            {selected.length > 0 && (
              <span className="ml-2 text-sm font-medium text-primary">{selected.length} selected</span>
            )}
          </h3>
          <button
            onClick={handleArchiveSelected}
            disabled={selected.length === 0 || busy}
            className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArchiveRestoreIcon className="w-4 h-4" />
            Archive Selected{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        </div>
        {activeOrders.length === 0 ? (
          <p className="p-6 text-stone-400 text-sm">No active orders.</p>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-primary cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs">Date</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs">Products</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activeOrders.map((o: any) => {
                  const isChecked = selected.includes(o.id);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => toggleOne(o.id)}
                      className={`cursor-pointer transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-stone-50'}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(o.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-stone-600 whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-stone-800">{summarize(o.items)}</td>
                      <td className="px-6 py-4 font-bold text-right">₱{o.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Archive — makikita ang products para malaman kung alin ang ibabalik */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">Archived Orders ({archived.length})</h3>
        </div>
        {archived.length === 0 ? (
          <p className="p-6 text-stone-400 text-sm">Nothing archived yet.</p>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs">Products</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs text-right">Total</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs">Archived On</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs">Days Left</th>
                  <th className="px-6 py-4 font-bold text-stone-500 uppercase text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {archived.map((o: any) => {
                  const daysLeft = 30 - o.days_archived;
                  return (
                    <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-stone-800">{summarize(o.items)}</p>
                        <p className="text-xs text-stone-400 mt-0.5">Ordered {new Date(o.created_at).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-right">₱{o.total}</td>
                      <td className="px-6 py-4 text-stone-600 whitespace-nowrap">{new Date(o.archived_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={daysLeft <= 5 ? 'text-red-500 font-bold' : 'text-stone-600'}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Will be permanently deleted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(o.id)}
                            className="text-primary font-bold text-xs flex items-center gap-1"
                          >
                            <ArrowLeftCircle className="w-4 h-4" />
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteArchived(o.id)}
                            className="text-red-500 font-bold text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      await uiAlert('All fields are required.', { title: 'Validation' });
      return;
    }
    if (newPassword !== confirmPassword) {
      await uiAlert('New password and confirmation do not match.', { title: 'Validation' });
      return;
    }
    if (newPassword.length < 6) {
      await uiAlert('New password must be at least 6 characters.', { title: 'Validation' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        await uiAlert(data.message || 'Password changed successfully.', { title: 'Done' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordModal(false);
      } else {
        await uiAlert(data?.error || 'Could not change password.', { title: 'Error' });
      }
    } catch {
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-serif font-bold text-stone-900">Settings</h2>
        <p className="text-stone-500">Account and password management</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
        <h3 className="text-xl font-bold text-stone-900">Account Settings</h3>
        <p className="text-sm text-stone-500">Change your admin password.</p>
        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="btn-primary"
        >
          Change Password
        </button>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={changingPassword} className="flex-1 btn-primary disabled:opacity-50">
                  {changingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ onExit, onLogout }: { onExit: () => void; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'inventory' | 'maintenance' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ORDERS_PAGE_SIZE = 25;
  const [reports, setReports] = useState<any[]>([]);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category_id: 'coffee',
    description: '',
    image: ''
  });

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showProductSaveSuccess, setShowProductSaveSuccess] = useState(false);
  const [showProductAddSuccess, setShowProductAddSuccess] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingProductBusy, setDeletingProductBusy] = useState(false);
  const [editProduct, setEditProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: ''
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      uiAlert('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      uiAlert('Image is too large. Max size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: reader.result })
        });
        const data = await res.json();
        if (data.success) {
          setNewProduct(prev => ({ ...prev, image: data.filename }));
        } else {
          uiAlert(data.error || 'Upload failed.');
        }
      } catch {
        uiAlert('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchData = async () => {
    setOrdersLoading(true);
    try {
      const [ordersRes, reportsRes, menuRes, ingredientsRes] = await Promise.all([
        fetch('/api/admin/orders').then(res => res.json()),
        fetch('/api/admin/reports').then(res => res.json()),
        fetch('/api/menu').then(res => res.json()),
        fetch('/api/admin/ingredients').then(res => res.json())
      ]);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setReports(reportsRes);
      setMenu(menuRes);
      setIngredients(ingredientsRes);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!categoryNotice) return;
    const timer = setTimeout(() => setCategoryNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [categoryNotice]);

  useEffect(() => {
    if (!deletingCategoryId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeletingCategoryId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deletingCategoryId]);

  useEffect(() => {
    if (!deletingProductId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deletingProductBusy) setDeletingProductId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deletingProductId, deletingProductBusy]);

  useEffect(() => {
    if (!showProductSaveSuccess) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProductSaveSuccess(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProductSaveSuccess]);

  // Bilang ng low-stock ingredients para sa maliit na badge sa sidebar
  const lowStockCount = ingredients.filter(i => i.stock_quantity <= i.low_stock_threshold).length;

  // Order history search + pagination
  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch]);

  const filteredOrders = orders.filter((o: any) => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    const idStr = String(o?.id ?? '').toLowerCase();
    const customerStr = String(o?.customer_name ?? o?.customer ?? o?.customerName ?? '').toLowerCase();
    const rawDateStr = String(o?.created_at ?? '').toLowerCase();
    const parsedDate = new Date(o?.created_at ?? '');
    const dateVariants = new Set<string>();
    dateVariants.add(rawDateStr);
    if (!Number.isNaN(parsedDate.getTime())) {
      dateVariants.add(parsedDate.toISOString().slice(0, 10));
      dateVariants.add(parsedDate.toLocaleDateString('en-US').toLowerCase());
      dateVariants.add(parsedDate.toLocaleDateString('en-GB').toLowerCase());
      dateVariants.add(parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase());
      dateVariants.add(parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase());
    }
    const dateStr = Array.from(dateVariants).join(' ');
    const statusStr = String(o?.status ?? 'completed').toLowerCase();
    let itemNamesStr = '';
    try {
      const items = JSON.parse(o?.items ?? '[]');
      if (Array.isArray(items)) {
        itemNamesStr = items.map((it: any) => String(it?.name ?? '')).join(' ').toLowerCase();
      }
    } catch {
      itemNamesStr = '';
    }
    return (
      idStr.includes(q) ||
      customerStr.includes(q) ||
      dateStr.includes(q) ||
      statusStr.includes(q) ||
      itemNamesStr.includes(q)
    );
  });

  const totalOrderRecords = filteredOrders.length;
  const totalOrderPages = Math.max(1, Math.ceil(totalOrderRecords / ORDERS_PAGE_SIZE));
  const safeOrderPage = Math.min(orderPage, totalOrderPages);
  const orderStartIndex = totalOrderRecords === 0 ? 0 : (safeOrderPage - 1) * ORDERS_PAGE_SIZE;
  const orderEndIndex = Math.min(orderStartIndex + ORDERS_PAGE_SIZE, totalOrderRecords);
  const pagedOrders = filteredOrders.slice(orderStartIndex, orderEndIndex);

  useEffect(() => {
    if (orderPage > totalOrderPages) setOrderPage(totalOrderPages);
  }, [orderPage, totalOrderPages]);

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setNewProduct({
          name: '',
          price: 0,
          category_id: 'coffee',
          description: '',
          image: ''
        });
        if (imageInputRef.current) imageInputRef.current.value = '';
        await fetchData();
        setShowProductAddSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        await uiAlert(data?.error || 'Could not add the product.', { title: 'Could not add' });
      }
    } catch {
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    }
  };

  const handleDeleteProduct = (id: string) => {
    setDeletingProductId(id);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProductId) return;
    const id = deletingProductId;
    setDeletingProductBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingProductId(null);
        setDeletingProductBusy(false);
        await fetchData();
        await uiAlert('Product deleted successfully.', { title: 'Done' });
      } else {
        const data = await res.json().catch(() => ({}));
        setDeletingProductId(null);
        setDeletingProductBusy(false);
        await uiAlert(data?.error || 'Could not delete the product.', { title: 'Could not delete' });
      }
    } catch {
      setDeletingProductId(null);
      setDeletingProductBusy(false);
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    }
  };

  const openEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditProduct({
      name: product.name || '',
      description: product.description || '',
      price: product.price != null ? String(product.price) : '',
      image: product.image || ''
    });
    setEditImageFile(null);
    if (editImageInputRef.current) editImageInputRef.current.value = '';
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProduct.name.trim()) {
      await uiAlert('Product name is required.', { title: 'Validation' });
      return;
    }
    const price = parseFloat(editProduct.price);
    if (Number.isNaN(price)) {
      await uiAlert('Please enter a valid price.', { title: 'Validation' });
      return;
    }
    if (price < 0) {
      await uiAlert('Price cannot be negative.', { title: 'Validation' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', editProduct.name.trim());
      formData.append('description', editProduct.description);
      formData.append('price', String(price));
      if (editImageFile) {
        formData.append('image', editImageFile);
      }
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        await uiAlert(data?.error || 'Could not update product.', { title: 'Update failed' });
        return;
      }
      if (data?.image) {
        setEditProduct(prev => ({ ...prev, image: data.image }));
      }
      setShowProductSaveSuccess(true);
      setEditingProduct(null);
      setEditImageFile(null);
      if (editImageInputRef.current) editImageInputRef.current.value = '';
      fetchData();
    } catch {
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryNotice(null);
    const categoryName = newCategoryName.trim();
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName })
    });
    if (res.ok) {
      setNewCategoryName('');
      await fetchData();
      setCategoryNotice(`Category added: ${categoryName}`);
    } else {
      const data = await res.json();
      uiAlert(data.error);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setDeletingCategoryId(id);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    const id = deletingCategoryId;
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeletingCategoryId(null);
      fetchData();
    } else {
      const data = await res.json();
      setDeletingCategoryId(null);
      uiAlert(data.error);
    }
  };

  const getImageUrl = (image: string) => {
    if (!image) return 'https://picsum.photos/seed/placeholder/400/300?grayscale';
    if (image.startsWith('http') || image.startsWith('data:')) return image;
    return `/images/${image}`;
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto bg-stone-900 text-white p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold">K</div>
          <h1 className="text-xl font-bold">Kapricho Admin</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
          >
            <History className="w-5 h-5" />
            Order History
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
          >
            <Package className="w-5 h-5" />
            Products
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
          >
            <Utensils className="w-5 h-5" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
          >
            <Boxes className="w-5 h-5" />
            <span className="flex-1 text-left">Inventory</span>
            {lowStockCount > 0 && (
              <span className="min-w-[22px] h-[22px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {lowStockCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'maintenance' ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
          >
            <ShieldAlert className="w-5 h-5" />
            Maintenance
          </button>
        </nav>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>

        <button
          onClick={onExit}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Exit Admin
        </button>

        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:bg-stone-800 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <header>
              <h2 className="text-3xl font-serif font-bold text-stone-900">Dashboard</h2>
              <p className="text-stone-500">Sales performance and analytics</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <h3 className="text-lg font-bold mb-6">Daily Sales (Last 30 Days)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                      <YAxis fontSize={12} tickMargin={10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="total" fill="#5A5A40" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <ProductSalesPie />
                
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <h3 className="text-lg font-bold mb-6">Sales Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reports}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                      <YAxis fontSize={12} tickMargin={10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="monotone" dataKey="total" stroke="#D4A373" strokeWidth={3} dot={{ r: 4, fill: '#D4A373' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 🔔 Inventory notification bell — itaas ng Sales per Product */}
            <LowStockNotification onGoToInventory={() => setActiveTab('inventory')} />

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-3 w-full sm:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={dashboardSearch}
                  onChange={e => setDashboardSearch(e.target.value)}
                  placeholder="Search dashboard..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary text-sm"
                  aria-label="Search dashboard"
                />
              </div>
            </div>

            <SalesByProductTable search={dashboardSearch} />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900">Order History</h2>
                <p className="text-stone-500">View and manage past transactions</p>
              </div>
            </header>

            {/* Responsive search bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search by order ID, customer name, date, or status..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary text-sm"
                  aria-label="Search orders"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-16 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm">Loading orders...</span>
                </div>
              ) : pagedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                  <History className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No orders found</p>
                  <p className="text-xs mt-1">
                    {orderSearch.trim() ? 'Try adjusting your search filters.' : 'There are no order records yet.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-100">
                        <tr>
                          <th className="px-6 py-4 text-sm font-bold text-stone-500 uppercase">Order ID</th>
                          <th className="px-6 py-4 text-sm font-bold text-stone-500 uppercase">Date</th>
                          <th className="px-6 py-4 text-sm font-bold text-stone-500 uppercase">Items</th>
                          <th className="px-6 py-4 text-sm font-bold text-stone-500 uppercase text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {pagedOrders.map(order => {
                          let items: any[] = [];
                          try { items = JSON.parse(order.items); } catch { items = []; }
                          return (
                            <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-sm">#{order.id.toString().padStart(4, '0')}</td>
                              <td className="px-6 py-4 text-sm text-stone-600">{new Date(order.created_at).toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-stone-600">
                                {items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-right">₱{order.total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-stone-100">
                    <p className="text-xs text-stone-500">
                      {totalOrderRecords === 0
                        ? 'No records'
                        : `Showing ${orderStartIndex + 1}–${orderEndIndex} of ${totalOrderRecords} records`}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                        disabled={safeOrderPage <= 1}
                        aria-label="Previous page"
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>
                      {Array.from({ length: totalOrderPages }, (_, i) => i + 1)
                        .filter(p => {
                          if (totalOrderPages <= 7) return true;
                          if (p === 1 || p === totalOrderPages) return true;
                          if (Math.abs(p - safeOrderPage) <= 1) return true;
                          return false;
                        })
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          const showEllipsis = prev && p - prev > 1;
                          return (
                            <span key={p} className="flex items-center">
                              {showEllipsis && <span className="px-2 text-stone-400">…</span>}
                              <button
                                onClick={() => setOrderPage(p)}
                                className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-medium border ${
                                  p === safeOrderPage
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-stone-200 hover:bg-stone-50'
                                }`}
                              >
                                {p}
                              </button>
                            </span>
                          );
                        })}
                      <button
                        onClick={() => setOrderPage(p => Math.min(totalOrderPages, p + 1))}
                        disabled={safeOrderPage >= totalOrderPages}
                        aria-label="Next page"
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 flex items-center gap-1"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900">Products</h2>
                <p className="text-stone-500">Manage your menu items</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Product Form */}
              <div className="lg:col-span-1">
                <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                  <h3 className="text-lg font-bold mb-4">Add New Product</h3>
                  
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                      placeholder="e.g. Iced Caramel Macchiato"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Price (₱)</label>
                      <input 
                        type="number" 
                        required
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                        className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Category</label>
                      <select 
                        value={newProduct.category_id}
                        onChange={e => setNewProduct({...newProduct, category_id: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary bg-white"
                      >
                        {menu?.categories
                          .filter(cat => {
                            const q = categorySearch.trim().toLowerCase();
                            if (!q) return true;
                            return cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q);
                          })
                          .map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Description</label>
                    <textarea 
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary h-24"
                      placeholder="Brief description of the product..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Product Image</label>
                    <div className="space-y-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleImageSelect}
                        className="w-full text-sm text-stone-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-primary file:text-white file:font-bold file:cursor-pointer hover:file:opacity-90"
                      />
                      {uploading && <p className="text-xs text-stone-400">Uploading...</p>}
                      {newProduct.image && !uploading && (
                        <div className="mt-2 relative h-32 rounded-2xl overflow-hidden border border-stone-100">
                          <img
                            src={newProduct.image.startsWith('http') ? newProduct.image : `/images/${newProduct.image}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400/300?grayscale';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewProduct({ ...newProduct, image: '' });
                              if (imageInputRef.current) imageInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow hover:bg-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" disabled={uploading} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                    <Plus className="w-4 h-4" />
                    {uploading ? 'Uploading image...' : 'Add to Menu'}
                  </button>
                </form>
              </div>

              {/* Product List */}
              <div className="lg:col-span-2 space-y-4">
                {menu?.categories.map(cat => (
                  <div key={cat.id} className="space-y-3">
                    <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest">{cat.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cat.items.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex gap-4 items-center">
                          <img src={getImageUrl(item.image)} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          <div className="flex-1">
                            <h5 className="font-bold text-stone-800">{item.name}</h5>
                            <p className="text-xs text-stone-500">₱{item.price}</p>
                          </div>
                          <button
                            onClick={() => setRecipeItem(item)}
                            className="p-2 text-stone-300 hover:text-accent transition-colors"
                            title="Manage Recipe (ingredients used)"
                          >
                            <Boxes className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openEditProduct(item)}
                            className="p-2 text-stone-300 hover:text-primary transition-colors"
                            title="Edit product"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <header>
              <h2 className="text-3xl font-serif font-bold text-stone-900">Categories</h2>
              <p className="text-stone-500">Manage menu categories</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <form onSubmit={handleAddCategory} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                  <h3 className="text-lg font-bold mb-4">Add New Category</h3>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Category Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                      placeholder="e.g. Desserts"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Category
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      placeholder="Search categories by name or ID..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-primary text-sm"
                      aria-label="Search categories"
                    />
                   </div>
                 </div>
                 {categoryNotice && (
                   <div
                     role="status"
                     aria-live="polite"
                     className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-green-200 bg-green-50 text-green-800 shadow-sm"
                   >
                     <div className="flex items-center gap-3">
                       <Check className="w-5 h-5 text-green-600" />
                       <p className="text-sm font-medium">{categoryNotice}</p>
                     </div>
                     <button
                       type="button"
                       onClick={() => setCategoryNotice(null)}
                       aria-label="Dismiss notification"
                       className="text-green-600 hover:text-green-800 transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 )}
                  {menu?.categories.filter(cat => {
                    const q = categorySearch.trim().toLowerCase();
                   if (!q) return true;
                   return cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q);
                 }).length === 0 && (
                   <p className="text-stone-400 text-sm p-6 bg-white rounded-2xl border border-stone-100">
                     No categories match your search.
                   </p>
                 )}
                 <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                   <table className="w-full text-left">
<thead className="bg-stone-50 border-b border-stone-100">
                      <tr>
                        <th className="px-6 py-4 text-sm font-bold text-stone-500 uppercase">Category Name</th>
                        <th className="px-6 py-4 text-sm font-bold text-stone-500 uppercase">ID</th>
                        <th className="px-6 py-4 text-sm font-bold text-stone-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {menu?.categories.map(cat => (
                        <tr key={cat.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-stone-800">{cat.name}</td>
                          <td className="px-6 py-4 text-sm text-stone-500 font-mono">{cat.id}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && <InventoryTab />}

        {activeTab === 'maintenance' && <MaintenanceTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {recipeItem && (
        <RecipeModal
          item={recipeItem}
          ingredients={ingredients}
          onClose={() => {
            setRecipeItem(null);
            fetchData();
          }}
        />
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Product Name</label>
                <input
                  type="text"
                  required
                  value={editProduct.name}
                  onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Description</label>
                <textarea
                  value={editProduct.description}
                  onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary h-20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Price (₱)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editProduct.price}
                  onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Product Image</label>
                <input
                  ref={editImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-stone-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-primary file:text-white file:font-bold file:cursor-pointer hover:file:opacity-90"
                />
                {editProduct.image && !editImageFile && (
                  <p className="text-xs text-stone-400 mt-1">Current: {editProduct.image}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingProductId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !deletingProductBusy) setDeletingProductId(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6">
            <div className="space-y-2">
              <h3 id="delete-product-title" className="text-xl font-bold text-stone-900">Delete product</h3>
              <p className="text-sm text-stone-600">
                Are you sure you want to delete {menu?.categories.flatMap(c => c.items).find(p => p.id === deletingProductId)?.name || 'this product'}?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => { if (!deletingProductBusy) setDeletingProductId(null); }}
                disabled={deletingProductBusy}
                className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={deletingProductBusy}
                className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingProductBusy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProductAddSuccess && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowProductAddSuccess(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-add-success-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 text-center">
            <div className="space-y-2">
              <h3 id="product-add-success-title" className="text-xl font-bold text-stone-900">Success</h3>
              <p className="text-sm text-stone-600">Product added successfully.</p>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => setShowProductAddSuccess(false)}
              className="w-full btn-primary"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showProductSaveSuccess && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowProductSaveSuccess(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-save-success-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 text-center">
            <div className="space-y-2">
              <h3 id="product-save-success-title" className="text-xl font-bold text-stone-900">Success</h3>
              <p className="text-sm text-stone-600">Product updated successfully.</p>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => setShowProductSaveSuccess(false)}
              className="w-full btn-primary"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {deletingCategoryId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setDeletingCategoryId(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6">
            <div className="space-y-2">
              <h3 id="delete-category-title" className="text-xl font-bold text-stone-900">Delete category</h3>
              <p className="text-sm text-stone-600">Are you sure you want to delete this category?</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setDeletingCategoryId(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ubos na ang ingredients ng product (galing sa server: available === false)
const isSoldOut = (item: MenuItem) => (item as MenuItem & { available?: boolean }).available === false;

function KioskApp() {
  // Laging NAKA-LOGOUT pagbukas ng kiosk: hindi na sine-save ang login sa browser,
  // kaya kailangang mag-sign in tuwing bubuksan (kahit hindi nag-logout nung huli).
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Burahin ang lumang saved login galing sa dating version
  useEffect(() => {
    localStorage.removeItem('kapricho_auth');
  }, []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('coffee');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [showAddOns, setShowAddOns] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const loadMenu = () =>
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => setMenu(data))
      .catch(() => { /* susubukan ulit sa susunod na refresh */ });

  // Menu + availability: nagre-refresh kada 15 segundo at tuwing bumabalik galing Admin
  useEffect(() => {
    loadMenu();
    const timer = setInterval(loadMenu, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) loadMenu();
  }, [isAdmin, isAuthenticated]);

  const addToCart = (item: MenuItem, selectedAddOns: AddOn[]) => {
    const uniqueId = `${item.id}-${Date.now()}`;
    const newCartItem: CartItem = {
      ...item,
      addons: selectedAddOns,
      quantity: 1,
      uniqueId
    };
    setCart([...cart, newCartItem]);
    setSelectedItem(null);
    setShowAddOns(false);
  };

  const removeFromCart = (uniqueId: string) => {
    setCart(cart.filter(item => item.uniqueId !== uniqueId));
  };

  const updateQuantity = (uniqueId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.uniqueId === uniqueId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => {
    const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
    return sum + (item.price + addonsTotal) * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total })
      });

      let data: any = null;
      try { data = await response.json(); } catch { /* hindi JSON ang sagot */ }

      // Na-ubos ang ingredients habang nasa cart: alisin sa order at i-refresh ang menu
      if (response.status === 409 && Array.isArray(data?.unavailable)) {
        const ids: string[] = data.unavailable.map((u: any) => u.id);
        const names: string = data.unavailable.map((u: any) => u.name).join(', ');
        setCart(prev => prev.filter(i => !ids.includes(i.id)));
        await loadMenu();
        await uiAlert(
          `Sorry, ${names} ${ids.length > 1 ? 'are' : 'is'} no longer available and ${ids.length > 1 ? 'were' : 'was'} removed from your order.\n\nPlease review your order and try again.`,
          { title: 'Item not available' }
        );
        return;
      }

      if (!response.ok || !data?.success) {
        await uiAlert(data?.error || 'Could not place the order. Please try again.', { title: 'Order failed' });
        return;
      }

      setOrderId(data.id);
      setShowReceipt(true);
      loadMenu(); // may nabawasang stock na — baka may product na ma-gray out
    } catch {
      await uiAlert('Cannot reach the server. Please try again.', { title: 'Connection problem' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = async () => {
    const ok = await uiConfirm('Are you sure you want to log out?', { title: 'Log out', confirmText: 'Confirm' });
    if (!ok) return;
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCart([]);
    setShowReceipt(false);
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'coffee': return <Coffee className="w-5 h-5" />;
      case 'non-coffee': return <Milk className="w-5 h-5" />;
      case 'milk-tea': return <Milk className="w-5 h-5" />;
      case 'sandwiches': return <Sandwich className="w-5 h-5" />;
      case 'pizza': return <PizzaIcon className="w-5 h-5" />;
      case 'rice-meals': return <Utensils className="w-5 h-5" />;
      case 'korean-drinks': return <Sparkles className="w-5 h-5" />;
      case 'extras': return <Plus className="w-5 h-5" />;
      default: return <ChevronRight className="w-5 h-5" />;
    }
  };

  const getImageUrl = (image: string) => {
    if (!image) return 'https://picsum.photos/seed/placeholder/400/300?grayscale';
    if (image.startsWith('http') || image.startsWith('data:')) return image;
    return `/images/${image}`;
  };

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  if (isAdmin) return <AdminPanel onExit={() => setIsAdmin(false)} onLogout={handleLogout} />;
  if (!menu) return <div className="flex items-center justify-center h-screen">Loading Kapricho...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-secondary">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-24 lg:w-32 md:h-screen md:sticky md:top-0 bg-white border-r border-stone-100 flex flex-row md:flex-col items-center py-4 md:py-8 no-print">
        {/* Logo */}
        <div className="px-4 mb-0 md:mb-8 shrink-0">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-serif text-xl font-bold">K</div>
        </div>

        {/* Categories - Scrollable area */}
        <div className="flex flex-row md:flex-col items-center gap-4 md:gap-6 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto flex-1 w-full px-2 py-2">
          {menu.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[80px] ${
                activeCategory === cat.id ? 'bg-primary text-white shadow-lg' : 'text-stone-400 hover:text-primary'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span className="text-[10px] font-semibold uppercase tracking-wider">{cat.name}</span>
            </button>
          ))}
        </div>
        
        {/* Admin Settings Button - Fixed at bottom */}
        <div className="mt-auto pt-4 pb-4 px-4 hidden md:flex flex-col items-center gap-1 shrink-0 border-t border-stone-50 w-full">
          <button 
            onClick={() => setIsAdmin(true)}
            className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all shadow-sm hover:shadow-md"
            title="Admin Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Admin</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto no-print">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Kapricho</h1>
            <p className="text-stone-500 italic">Handcrafted flavors for your every whim.</p>
          </div>
          <button 
            onClick={() => setIsAdmin(true)}
            className="p-2 text-stone-300 hover:text-primary transition-colors"
            title="Admin Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menu.categories.find(c => c.id === activeCategory)?.items.map(item => (
            <motion.div
              layoutId={item.id}
              key={item.id}
              onClick={() => {
                if (isSoldOut(item)) return; // ubos na ang ingredients
                setSelectedItem(item);
                setShowAddOns(true);
              }}
              aria-disabled={isSoldOut(item)}
              className={`card group ${isSoldOut(item) ? 'grayscale opacity-60 cursor-not-allowed select-none' : 'cursor-pointer'}`}
              whileHover={isSoldOut(item) ? undefined : { y: -5 }}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={getImageUrl(item.image)} 
                  alt={item.name} 
                  className={`w-full h-full object-cover transition-transform duration-500 ${isSoldOut(item) ? '' : 'group-hover:scale-110'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-primary">
                  ₱{item.price}
                </div>
                {isSoldOut(item) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-900/30">
                    <span className="bg-stone-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">
                      Not available
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-stone-800 mb-1">{item.name}</h3>
                <p className="text-sm text-stone-500 line-clamp-2">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Cart Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-l border-stone-100 flex flex-col no-print md:sticky md:top-0 md:h-screen md:self-start">
        <div className="p-6 border-bottom border-stone-100 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Order
          </h2>
          <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-500">{cart.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center">
              <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
              <p>Your cart is empty.<br/>Select something delicious!</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.uniqueId} className="flex gap-4 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <img src={getImageUrl(item.image)} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-stone-800">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.uniqueId)} className="text-stone-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {item.addons.length > 0 && (
                    <p className="text-[10px] text-stone-500 italic">
                      + {item.addons.map(a => a.name).join(', ')}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 px-1">
                      <button onClick={() => updateQuantity(item.uniqueId, -1)} className="p-1 text-stone-500"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.uniqueId, 1)} className="p-1 text-stone-500"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="font-bold text-sm text-primary">₱{(item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100 space-y-4">
          <div className="flex justify-between items-center text-stone-500 text-sm">
            <span>Subtotal</span>
            <span>₱{total}</span>
          </div>
          <div className="flex justify-between items-center text-stone-500 text-sm">
            <span>Tax (Included)</span>
            <span>₱0.00</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-stone-900 pt-2 border-t border-stone-200">
            <span>Total</span>
            <span>₱{total}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Place Order
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Add-on Modal */}
      <AnimatePresence>
        {showAddOns && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="relative h-48">
                <img src={getImageUrl(selectedItem.image)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setShowAddOns(false)}
                  className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-serif font-bold text-stone-900">{selectedItem.name}</h2>
                  <p className="text-stone-500">{selectedItem.description}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Optional Add-ons</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {(() => {
                        if (!menu || !menu.addons) return [];
                        const itemCatId = (selectedItem.category_id || activeCategory || '').toLowerCase();
                        const isDrink = itemCatId.includes('coffee') || 
                                        itemCatId.includes('tea') || 
                                        itemCatId.includes('drink') || 
                                        itemCatId.includes('beverage') || 
                                        itemCatId.includes('juice') || 
                                        itemCatId.includes('ade') ||
                                        itemCatId.includes('milk') ||
                                        itemCatId.includes('smoothie');
                        const addonsList = isDrink ? menu.addons.drinks : menu.addons.food;
                        return addonsList || [];
                      })().map(addon => {
                        const isSelected = selectedAddOns.some(a => a.id === addon.id);
                        return (
                          <button
                            key={addon.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
                              } else {
                                setSelectedAddOns([...selectedAddOns, addon]);
                              }
                            }}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-stone-100 hover:border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-stone-300'}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="font-medium text-stone-700">{addon.name}</span>
                            </div>
                            <span className="text-stone-500">+₱{addon.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-stone-50 border-t border-stone-100">
                <button 
                  onClick={() => {
                    addToCart(selectedItem, selectedAddOns);
                    setSelectedAddOns([]);
                  }}
                  className="w-full btn-primary"
                >
                  Add to Order • ₱{selectedItem.price + selectedAddOns.reduce((s, a) => s + a.price, 0)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md no-print">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center border-b border-dashed border-stone-200">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-stone-900">Order Confirmed!</h2>
                <p className="text-stone-500">Order #{orderId?.toString().padStart(4, '0')}</p>
              </div>

              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.uniqueId} className="flex justify-between text-sm">
                      <span className="text-stone-600">{item.quantity}x {item.name}</span>
                      <span className="font-bold">₱{(item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-dashed border-stone-200 flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span className="text-primary">₱{total}</span>
                </div>
              </div>

              <div className="p-8 bg-stone-50 flex gap-4">
                <button 
                  onClick={() => {
                    setCart([]);
                    setShowReceipt(false);
                  }}
                  className="flex-1 px-6 py-3 rounded-full border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-100"
                >
                  New Order
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Receipt */}
      <div className="print-only p-8 font-mono text-sm w-[80mm] mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase">Kapricho Cafe</h1>
          <p>San Juan, La Union</p>
          <p>Order #{orderId?.toString().padStart(4, '0')}</p>
          <p>{new Date().toLocaleString()}</p>
        </div>
        <div className="border-t border-b border-black py-4 my-4 space-y-2">
          {cart.map(item => (
            <div key={item.uniqueId}>
              <div className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>₱{item.price * item.quantity}</span>
              </div>
              {item.addons.map(a => (
                <div key={a.id} className="flex justify-between pl-4 text-xs italic">
                  <span>+ {a.name}</span>
                  <span>₱{a.price * item.quantity}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL</span>
          <span>₱{total}</span>
        </div>
        <div className="text-center mt-8 pt-8 border-t border-black">
          <p>Thank you for choosing Kapricho!</p>
          <p>Please wait for your number.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <KioskApp />
      <DialogHost />
    </>
  );
}