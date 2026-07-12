'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, RefreshCw, TrendingUp, TrendingDown, Minus, Zap, ArrowRight } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatCO2, formatNumber } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

const DEPT_COLORS = ['#22C55E', '#3B82F6', '#A855F7', '#F97316', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];
const TYPE_COLORS = { PURCHASE: '--blue', MANUFACTURING: '--green', FLEET: '--orange', EXPENSE: '--purple' };

// ── Tab bar ────────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-[var(--panel2)] rounded-xl p-1 border border-[var(--border)]">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            active === t.key
              ? 'bg-[var(--panel)] text-[var(--text)] shadow-sm border border-[var(--border)]'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Type pill ──────────────────────────────────────────────────────────────────
function TypePill({ type }) {
  const map = {
    PURCHASE: { label: 'Purchase', color: 'var(--blue)' },
    MANUFACTURING: { label: 'Manufacturing', color: 'var(--green)' },
    FLEET: { label: 'Fleet', color: 'var(--orange)' },
    EXPENSE: { label: 'Expense', color: 'var(--purple)' },
  };
  const cfg = map[type] || { label: type, color: 'var(--muted)' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}40` }}
    >
      {cfg.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOG OPERATION TAB
// ═══════════════════════════════════════════════════════════════════════════════
function LogOperationTab({ departments, factors, onSaved }) {
  const toast = useToast();
  const [type, setType] = useState('FLEET');
  const [deptId, setDeptId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [factorId, setFactorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [operations, setOperations] = useState([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [autoCalcOn, setAutoCalcOn] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual entry form state
  const [mDeptId, setMDeptId] = useState('');
  const [mFactorId, setMFactorId] = useState('');
  const [mQty, setMQty] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10));
  const [mSubmitting, setMSubmitting] = useState(false);

  const filteredFactors = factors.filter((f) => f.sourceType === type && f.status === 'Active');
  const selectedFactor = factors.find((f) => f.id === parseInt(factorId));

  const loadOps = useCallback(async () => {
    setLoadingOps(true);
    try {
      const res = await fetch('/api/environmental/operations');
      if (res.ok) setOperations(await res.json());
    } finally {
      setLoadingOps(false);
    }
  }, []);

  useEffect(() => {
    loadOps();
    // Check autoCalc setting
    fetch('/api/settings/esg-config')
      .then((r) => r.json())
      .then((d) => setAutoCalcOn(d.autoEmissionCalc ?? true))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset factor when type changes
  useEffect(() => { setFactorId(''); }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!factorId) { toast.error('Please select an Emission Factor'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/environmental/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, departmentId: deptId, description, quantity: parseFloat(quantity), emissionFactorId: factorId, date }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to log operation'); return; }
      if (json.autoCalc) {
        toast.success(`Operation logged — ${json.co2Amount.toFixed(2)} kg CO₂ auto-recorded`);
      } else {
        toast.success('Operation saved — pending CO₂ conversion');
      }
      setDescription(''); setQuantity(''); setFactorId('');
      loadOps();
      onSaved?.();
    } catch { toast.error('Network error'); }
    finally { setSubmitting(false); }
  };

  const handleConvert = async (opId) => {
    try {
      const res = await fetch(`/api/environmental/operations/${opId}/convert`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Conversion failed'); return; }
      toast.success(`Converted — ${json.co2Amount.toFixed(2)} kg CO₂ MANUAL`);
      loadOps();
      onSaved?.();
    } catch { toast.error('Network error'); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setMSubmitting(true);
    try {
      const res = await fetch('/api/environmental/carbon-transactions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: mDeptId, emissionFactorId: mFactorId, quantity: parseFloat(mQty), date: mDate }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed'); return; }
      toast.success(`Manual entry — ${json.co2Amount.toFixed(2)} kg CO₂ recorded`);
      setShowManualModal(false);
      setMDeptId(''); setMFactorId(''); setMQty('');
      onSaved?.();
    } catch { toast.error('Network error'); }
    finally { setMSubmitting(false); }
  };

  const opColumns = [
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'type', label: 'Type', render: (v) => <TypePill type={v} /> },
    { key: 'department', label: 'Department', render: (v) => v?.name || '—' },
    { key: 'description', label: 'Description' },
    { key: 'quantity', label: 'Qty', render: (v, row) => `${v} ${row.unit}` },
    { key: 'emissionFactor', label: 'Factor', render: (v) => v?.name || '—' },
    {
      key: 'carbonTransactions',
      label: 'CO₂ Status',
      render: (txs, row) => {
        if (txs && txs.length > 0) {
          const total = txs.reduce((s, t) => s + t.co2Amount, 0);
          return (
            <span className="text-xs font-medium text-[var(--green)]">
              {total.toFixed(2)} kg AUTO
            </span>
          );
        }
        return (
          <button
            onClick={() => handleConvert(row.id)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--amber)]/20 text-[var(--amber)] hover:bg-[var(--amber)]/30 transition-colors"
          >
            <ArrowRight size={10} /> Convert
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Auto-calc status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${autoCalcOn ? 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]' : 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]'}`}>
        <Zap size={14} />
        {autoCalcOn
          ? 'Auto Emission Calculation is ON — operations will generate CO₂ transactions instantly.'
          : 'Auto Emission Calculation is OFF — operations will be saved as pending until manually converted.'}
        {!autoCalcOn && (
          <button
            onClick={() => setShowManualModal(true)}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-[var(--text)] text-xs hover:bg-[var(--border)] transition-colors"
          >
            <Plus size={12} /> Manual Carbon Entry
          </button>
        )}
      </div>

      {/* Log form */}
      <Card>
        <CardHeader>
          <CardTitle>Log ERP Operation</CardTitle>
          <span className="text-xs text-[var(--muted)]">Purchase / Manufacturing / Fleet / Expense</span>
        </CardHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <Select id="op-type" label="Type *" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="PURCHASE">Purchase</option>
            <option value="MANUFACTURING">Manufacturing</option>
            <option value="FLEET">Fleet</option>
            <option value="EXPENSE">Expense</option>
          </Select>

          <Select id="op-dept" label="Department *" value={deptId} onChange={(e) => setDeptId(e.target.value)} required>
            <option value="">— Select Department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>

          <Select id="op-factor" label="Emission Factor *" value={factorId} onChange={(e) => setFactorId(e.target.value)} required>
            <option value="">— Select Factor ({type}) —</option>
            {filteredFactors.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.co2PerUnit} kg/{f.unit})</option>
            ))}
          </Select>

          <Input
            id="op-qty"
            label={`Quantity${selectedFactor ? ` (${selectedFactor.unit})` : ''} *`}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="e.g. 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            helper={selectedFactor && quantity ? `≈ ${(parseFloat(quantity) * selectedFactor.co2PerUnit).toFixed(2)} kg CO₂` : ''}
          />

          <Input
            id="op-desc"
            label="Description *"
            placeholder="e.g. Diesel for delivery trucks"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <Input
            id="op-date"
            label="Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving…' : autoCalcOn ? '⚡ Log & Auto-Calculate CO₂' : 'Log Operation (Pending)'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
          <button onClick={loadOps} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)] transition-colors">
            <RefreshCw size={14} />
          </button>
        </CardHeader>
        <DataTable columns={opColumns} data={operations} loading={loadingOps} emptyMessage="No operations logged yet." />
      </Card>

      {/* Manual Carbon Entry Modal */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Manual Carbon Entry" size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowManualModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleManualSubmit} disabled={mSubmitting}>{mSubmitting ? 'Saving…' : 'Record CO₂'}</Button>
          </>
        }
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Select id="m-dept" label="Department *" value={mDeptId} onChange={(e) => setMDeptId(e.target.value)} required>
            <option value="">— Select —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select id="m-factor" label="Emission Factor *" value={mFactorId} onChange={(e) => setMFactorId(e.target.value)} required>
            <option value="">— Select Factor —</option>
            {factors.filter((f) => f.status === 'Active').map((f) => (
              <option key={f.id} value={f.id}>{f.name} — {f.sourceType} ({f.co2PerUnit} kg/{f.unit})</option>
            ))}
          </Select>
          <Input id="m-qty" label="Quantity *" type="number" min="0.01" step="0.01" value={mQty} onChange={(e) => setMQty(e.target.value)} required />
          <Input id="m-date" label="Date *" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} required />
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS LIST TAB
// ═══════════════════════════════════════════════════════════════════════════════
function TransactionsTab({ departments, factors }) {
  const [data, setData] = useState([]);
  const [filterTotal, setFilterTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fDept, setFDept] = useState('');
  const [fType, setFType] = useState('');
  const [fSource, setFSource] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fDept) params.set('departmentId', fDept);
    if (fType) params.set('type', fType);
    if (fSource) params.set('source', fSource);
    if (fFrom) params.set('dateFrom', fFrom);
    if (fTo) params.set('dateTo', fTo);
    try {
      const res = await fetch(`/api/environmental/carbon-transactions?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
        setFilterTotal(json.filterTotal || 0);
        setMonthTotal(json.monthTotal || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [fDept, fType, fSource, fFrom, fTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    const headers = ['Date', 'Department', 'Source Type', 'Emission Factor', 'Quantity', 'Unit', 'CO₂ (kg)', 'Source'];
    const rows = data.map((t) => [
      new Date(t.date).toISOString().slice(0, 10),
      t.department?.name || '',
      t.emissionFactor?.sourceType || t.operation?.type || '',
      t.emissionFactor?.name || '',
      t.quantity,
      t.emissionFactor?.unit || '',
      t.co2Amount.toFixed(4),
      t.source,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'department', label: 'Department', render: (v) => v?.name || '—' },
    {
      key: 'emissionFactor',
      label: 'Source Type',
      render: (v, row) => <TypePill type={v?.sourceType || row.operation?.type || 'PURCHASE'} />,
    },
    { key: 'emissionFactor', label: 'Emission Factor', render: (v) => v?.name || '—' },
    { key: 'quantity', label: 'Quantity', render: (v, row) => `${formatNumber(v, 2)} ${row.emissionFactor?.unit || ''}` },
    { key: 'co2Amount', label: 'CO₂ (kg)', render: (v) => <span className="font-medium text-[var(--green)]">{formatCO2(v)}</span> },
    {
      key: 'source',
      label: 'Source',
      render: (v) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v === 'AUTO' ? 'bg-[var(--green)]/20 text-[var(--green)] border border-[var(--green)]/30' : 'bg-[var(--muted)]/20 text-[var(--muted)] border border-[var(--muted)]/30'}`}>
          {v}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Select id="ft-dept" label="" value={fDept} onChange={(e) => setFDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select id="ft-type" label="" value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">All Types</option>
          <option value="PURCHASE">Purchase</option>
          <option value="MANUFACTURING">Manufacturing</option>
          <option value="FLEET">Fleet</option>
          <option value="EXPENSE">Expense</option>
        </Select>
        <Select id="ft-src" label="" value={fSource} onChange={(e) => setFSource(e.target.value)}>
          <option value="">All Sources</option>
          <option value="AUTO">AUTO</option>
          <option value="MANUAL">MANUAL</option>
        </Select>
        <Input id="ft-from" type="date" placeholder="From" value={fFrom} onChange={(e) => setFFrom(e.target.value)} />
        <Input id="ft-to" type="date" placeholder="To" value={fTo} onChange={(e) => setFTo(e.target.value)} />
      </div>

      <Card padding={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--text)]">{data.length} records</span>
          <Button variant="ghost" onClick={exportCSV}>
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
        </div>

        <DataTable columns={columns} data={data} loading={loading} emptyMessage="No carbon transactions match the selected filters." />

        {/* Footer strip */}
        <div className="px-5 py-3 bg-[var(--panel2)] border-t border-[var(--border)] flex flex-wrap items-center gap-6 text-sm">
          <span className="text-[var(--muted)]">
            <span className="font-medium text-[var(--text)]">Filter Total:</span>{' '}
            <span className="text-[var(--green)] font-semibold">{formatCO2(filterTotal)}</span>
          </span>
          <span className="text-[var(--muted)]">
            <span className="font-medium text-[var(--text)]">This Month:</span>{' '}
            <span className="text-[var(--blue)] font-semibold">{formatCO2(monthTotal)}</span>
          </span>
          <span className="text-xs text-[var(--muted)] ml-auto italic">
            Carbon Transactions auto-generated from Purchase / Manufacturing / Fleet / Expenses
          </span>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BY DEPARTMENT TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ByDepartmentTab({ onDeptSelect }) {
  const [depts, setDepts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [monthKeys, setMonthKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState(null);

  useEffect(() => {
    fetch('/api/environmental/carbon-transactions/by-department')
      .then((r) => r.json())
      .then((d) => {
        setDepts(d.departments || []);
        setChartData(d.chartData || []);
        setMonthKeys(d.monthKeys || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBarClick = (data) => {
    if (!data?.activeLabel) return;
    // find dept by name in bar label — activePayload
    const deptName = data?.activePayload?.[0]?.name;
    if (deptName) {
      setActiveDept(deptName);
      onDeptSelect?.(deptName);
    }
  };

  const tableColumns = [
    { key: 'name', label: 'Department' },
    { key: 'thisMonth', label: 'This Month', render: (v) => <span className="font-medium text-[var(--green)]">{formatCO2(v)}</span> },
    { key: 'lastMonth', label: 'Last Month', render: (v) => formatCO2(v) },
    {
      key: 'delta',
      label: 'Δ%',
      render: (v) => {
        if (v === null) return <span className="text-[var(--muted)]">—</span>;
        const up = v > 0;
        return (
          <span className={`flex items-center gap-1 font-medium ${up ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(v)}%
          </span>
        );
      },
    },
    { key: 'ytd', label: 'YTD', render: (v) => formatCO2(v) },
  ];

  if (loading) return <div className="py-20 text-center text-[var(--muted)] text-sm">Loading department data…</div>;

  return (
    <div className="space-y-5">
      {activeDept && (
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          Filtering by: <span className="font-medium text-[var(--text)]">{activeDept}</span>
          <button onClick={() => { setActiveDept(null); onDeptSelect?.(null); }} className="text-[var(--blue)] hover:underline">Clear</button>
        </div>
      )}

      <Card padding={false}>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Emissions by Department — Last 6 Months</CardTitle>
          <span className="text-xs text-[var(--muted)]">Click a bar to filter transactions</span>
        </CardHeader>
        <div className="p-5 pt-3" style={{ height: 300 }}>
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[var(--muted)] text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={55}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}kg`} />
                <Tooltip
                  contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }}
                  formatter={(v, name) => [`${v.toFixed(2)} kg`, name]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                {depts.map((d, i) => (
                  <Bar
                    key={d.name}
                    dataKey={d.name}
                    fill={DEPT_COLORS[i % DEPT_COLORS.length]}
                    radius={[3, 3, 0, 0]}
                    opacity={activeDept && activeDept !== d.name ? 0.3 : 1}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Summary</CardTitle>
        </CardHeader>
        <DataTable columns={tableColumns} data={depts} emptyMessage="No department emissions data." />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function CarbonTransactionsPage() {
  const [activeTab, setActiveTab] = useState('log');
  const [departments, setDepartments] = useState([]);
  const [factors, setFactors] = useState([]);
  const [deptFilter, setDeptFilter] = useState(null);

  useEffect(() => {
    fetch('/api/settings/departments').then((r) => r.json()).then(setDepartments).catch(() => {});
    fetch('/api/environmental/emission-factors').then((r) => r.json()).then(setFactors).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeptSelect = (name) => {
    setDeptFilter(name);
    if (name) setActiveTab('transactions');
  };

  const tabs = [
    { key: 'log', label: '⚡ Log Operation' },
    { key: 'transactions', label: 'Carbon Transactions' },
    { key: 'by-dept', label: 'By Department' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Carbon Transactions</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Auto emission calculation from Purchase / Manufacturing / Fleet / Expenses
        </p>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'log' && (
        <LogOperationTab
          departments={departments}
          factors={factors}
          onSaved={() => {}}
        />
      )}
      {activeTab === 'transactions' && (
        <TransactionsTab departments={departments} factors={factors} initialDeptFilter={deptFilter} />
      )}
      {activeTab === 'by-dept' && (
        <ByDepartmentTab onDeptSelect={handleDeptSelect} />
      )}
    </div>
  );
}