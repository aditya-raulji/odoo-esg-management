'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusPill from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Leaf, FileText, ArrowLeft, Download, Printer } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';

export default function EnvironmentalReport() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/reports/environmental')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch environmental report data');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        toast.error('Error', err.message);
      });
  }, [toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--green)]"></div>
        <p className="text-[var(--muted)] text-sm animate-pulse">Analyzing carbon metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto text-center p-8 space-y-4 border border-[var(--red)]">
        <h2 className="text-xl font-bold text-[var(--red)]">Failed to Load Report</h2>
        <p className="text-sm text-[var(--muted)]">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </Card>
    );
  }

  const { kpis, emissionsByDept, emissionsBySource, goals, products } = data;

  const COLORS = ['#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EF4444', '#F59E0B'];

  const handleExportPDF = () => {
    try {
      const tables = [
        {
          title: 'Environmental Goals Progress',
          headers: ['Goal Name', 'Department', 'Target CO2 (t)', 'Current CO2 (t)', 'Progress %', 'Status', 'Deadline'],
          rows: goals.map(g => [
            g.name,
            g.department,
            g.targetCO2.toFixed(1),
            g.currentCO2.toFixed(1),
            `${g.progress}%`,
            g.status,
            new Date(g.deadline).toLocaleDateString()
          ])
        },
        {
          title: 'Product ESG Profiles',
          headers: ['Product Name', 'SKU', 'Category', 'Carbon Footprint (kg)', 'Recyclable %', 'Rating'],
          rows: products.map(p => [
            p.name,
            p.sku,
            p.category,
            p.carbonFootprintPerUnit.toFixed(1),
            `${p.recyclablePercent}%`,
            p.sustainabilityRating
          ])
        }
      ];

      const formattedKpis = {
        'Total CO2 YTD (t)': kpis.totalCo2YTD,
        'CO2 This Month (t)': kpis.totalCo2Month,
        'Active Goals': kpis.activeGoalsCount,
        'Avg Goal Progress': `${kpis.avgGoalProgress}%`
      };

      exportToPDF('Environmental Impact', tables, 'Environmental_Report.pdf', formattedKpis);
      toast.success('Success', 'Environmental Report exported to PDF');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate PDF export');
    }
  };

  const handleExportExcel = () => {
    try {
      const sheets = {
        'Summary KPIs': [
          { 'Metric Name': 'Total CO2 YTD (tonnes)', 'Value': kpis.totalCo2YTD },
          { 'Metric Name': 'CO2 This Month (tonnes)', 'Value': kpis.totalCo2Month },
          { 'Metric Name': 'Active Goals Count', 'Value': kpis.activeGoalsCount },
          { 'Metric Name': 'Average Goal Progress (%)', 'Value': kpis.avgGoalProgress }
        ],
        'Environmental Goals': goals.map(g => ({
          'Goal Name': g.name,
          'Department': g.department,
          'Target CO2 (t)': g.targetCO2,
          'Current CO2 (t)': g.currentCO2,
          'Progress %': g.progress,
          'Status': g.status,
          'Deadline': new Date(g.deadline).toLocaleDateString()
        })),
        'Product ESG Profiles': products.map(p => ({
          'Product Name': p.name,
          'SKU': p.sku,
          'Category': p.category,
          'Carbon Footprint / Unit (kg)': p.carbonFootprintPerUnit,
          'Recyclable %': p.recyclablePercent,
          'Sustainability Rating': p.sustainabilityRating
        }))
      };

      exportToExcel(sheets, 'Environmental_Report.xlsx');
      toast.success('Success', 'Environmental Report exported to Excel');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate Excel export');
    }
  };

  const handleExportCSV = () => {
    try {
      // Primary table is Goals Table
      const csvData = goals.map(g => ({
        'Goal Name': g.name,
        'Department': g.department,
        'Target CO2 (t)': g.targetCO2,
        'Current CO2 (t)': g.currentCO2,
        'Progress %': g.progress,
        'Status': g.status,
        'Deadline': new Date(g.deadline).toLocaleDateString()
      }));

      exportToCSV(csvData, 'Environmental_Goals_Report.csv');
      toast.success('Success', 'Environmental Goals exported to CSV');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate CSV export');
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <Link 
            href="/reports" 
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Reports Hub
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)] font-space-grotesk flex items-center gap-2">
            <Leaf size={24} className="text-[var(--green)]" />
            Environmental Report
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Annualized Greenhouse Gas (GHG) reporting, carbon transactions, and goal tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
            <Download size={14} />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex items-center gap-1.5">
            <Download size={14} />
            Excel
          </Button>
          <Button variant="green" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5">
            <Download size={14} />
            Export PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="flex items-center gap-1.5 border border-[var(--border)]">
            <Printer size={14} />
            Print
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-2 border-t-[var(--green)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Total CO₂ YTD</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.totalCo2YTD} <span className="text-xs font-normal text-[var(--muted)]">tonnes</span></p>
          <p className="text-xs text-[var(--muted)] mt-1">Calendar year 2026</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--green)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">CO₂ This Month</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.totalCo2Month} <span className="text-xs font-normal text-[var(--muted)]">tonnes</span></p>
          <p className="text-xs text-[var(--muted)] mt-1">July 2026</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--green)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Active Goals</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.activeGoalsCount}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Environmental targets</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--green)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Avg Goal Progress</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.avgGoalProgress}%</p>
          <div className="mt-2">
            <ProgressBar value={kpis.avgGoalProgress} size="xs" color="green" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Emissions Bar Chart */}
        <Card padding={false} className="lg:col-span-2">
          <CardHeader className="p-5 pb-0">
            <CardTitle>Emissions by Department (t CO₂ YTD)</CardTitle>
          </CardHeader>
          <div className="h-72 p-5 pt-0">
            {emissionsByDept.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--text)' }}
                  />
                  <Bar dataKey="co2" fill="var(--green)" radius={[4, 4, 0, 0]} name="Emissions (tonnes)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">No transaction records found</div>
            )}
          </div>
        </Card>

        {/* Source Type Donut Chart */}
        <Card padding={false}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>Emissions by Source Type</CardTitle>
          </CardHeader>
          <div className="h-72 p-5 flex flex-col justify-center">
            {emissionsBySource.length > 0 ? (
              <div className="relative h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emissionsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {emissionsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Labels list */}
                <div className="flex flex-wrap gap-2 justify-center mt-2 overflow-y-auto max-h-16">
                  {emissionsBySource.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{entry.name.toLowerCase()}</span>
                      <span className="font-semibold">({entry.value.toFixed(1)}t)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">No transaction records found</div>
            )}
          </div>
        </Card>
      </div>

      {/* Goal Tracking Table */}
      <Card padding={false}>
        <CardHeader className="p-5 border-b border-[var(--border)]">
          <CardTitle>Department Environmental Goals</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--panel2)] text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Goal Name</th>
                <th className="px-5 py-3.5 font-semibold">Department</th>
                <th className="px-5 py-3.5 font-semibold text-right">Target (t)</th>
                <th className="px-5 py-3.5 font-semibold text-right">Current (t)</th>
                <th className="px-5 py-3.5 font-semibold">Progress</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {goals.length > 0 ? (
                goals.map((g) => (
                  <tr key={g.id} className="hover:bg-[var(--panel2)]/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-[var(--text)]">{g.name}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">{g.department}</td>
                    <td className="px-5 py-4 text-right text-[var(--muted)] font-mono">{g.targetCO2.toFixed(1)}</td>
                    <td className="px-5 py-4 text-right text-[var(--muted)] font-mono">{g.currentCO2.toFixed(1)}</td>
                    <td className="px-5 py-4 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[var(--text)] w-8 text-right">{g.progress}%</span>
                        <div className="flex-1">
                          <ProgressBar value={g.progress} size="xs" color="green" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={g.status === 'ACTIVE' || g.status === 'ON_TRACK' ? 'On Track' : 'Completed'} />
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)] font-mono text-xs">{new Date(g.deadline).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-[var(--muted)]">No goals found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Profiles Table */}
      <Card padding={false}>
        <CardHeader className="p-5 border-b border-[var(--border)]">
          <CardTitle>Product ESG Profiles</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--panel2)] text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Product Name</th>
                <th className="px-5 py-3.5 font-semibold">SKU</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold text-right">Carbon Footprint / Unit (kg)</th>
                <th className="px-5 py-3.5 font-semibold text-right">Recyclable %</th>
                <th className="px-5 py-3.5 font-semibold text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--panel2)]/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-[var(--text)]">{p.name}</td>
                    <td className="px-5 py-4 text-[var(--muted)] font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">{p.category}</td>
                    <td className="px-5 py-4 text-right text-[var(--muted)] font-mono">{p.carbonFootprintPerUnit.toFixed(1)}</td>
                    <td className="px-5 py-4 text-right text-[var(--muted)] font-mono">{p.recyclablePercent}%</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        p.sustainabilityRating === 'A' ? 'bg-[var(--green)]/20 text-[var(--green)]' :
                        p.sustainabilityRating === 'B' ? 'bg-[var(--blue)]/20 text-[var(--blue)]' :
                        p.sustainabilityRating === 'C' ? 'bg-[var(--orange)]/20 text-[var(--orange)]' :
                        'bg-[var(--red)]/20 text-[var(--red)]'
                      }`}>
                        {p.sustainabilityRating}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-[var(--muted)]">No product profiles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}