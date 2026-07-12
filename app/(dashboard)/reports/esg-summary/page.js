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
  Tooltip, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { BarChart3, FileText, ArrowLeft, Download, Printer } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';

export default function ESGSummaryPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/reports/esg-summary')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch ESG summary report');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--blue)]"></div>
        <p className="text-[var(--muted)] text-sm animate-pulse">Consolidating ESG scores...</p>
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

  const { departmentScores, overall, weights, sparkline, executiveSummary } = data;

  const handleExportPDF = () => {
    try {
      const tables = [
        {
          title: 'Department ESG Scores Comparison',
          headers: ['Department Name', 'Environmental (E)', 'Social (S)', 'Governance (G)', 'Overall Score'],
          rows: departmentScores.map(d => [
            d.departmentName,
            d.env.toFixed(1),
            d.social.toFixed(1),
            d.gov.toFixed(1),
            d.total.toFixed(1)
          ])
        }
      ];

      const formattedKpis = {
        'Overall ESG Score': overall.total.toString(),
        'Environmental (E) Avg': overall.env.toFixed(1),
        'Social (S) Avg': overall.social.toFixed(1),
        'Governance (G) Avg': overall.gov.toFixed(1)
      };

      exportToPDF('ESG Executive Summary', tables, 'ESG_Summary_Report.pdf', formattedKpis);
      toast.success('Success', 'ESG Summary exported to PDF');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate PDF export');
    }
  };

  const handleExportExcel = () => {
    try {
      const sheets = {
        'Overall ESG Scores': [
          { 'Metric': 'Overall ESG Rating', 'Score': overall.total, 'Weight %': '100%' },
          { 'Metric': 'Environmental (E)', 'Score': overall.env, 'Weight %': `${weights.env}%` },
          { 'Metric': 'Social (S)', 'Score': overall.social, 'Weight %': `${weights.social}%` },
          { 'Metric': 'Governance (G)', 'Score': overall.gov, 'Weight %': `${weights.gov}%` }
        ],
        'Department Comparison': departmentScores.map(d => ({
          'Department': d.departmentName,
          'Environmental Score': d.env,
          'Social Score': d.social,
          'Governance Score': d.gov,
          'Overall Total Score': d.total
        })),
        '12-Month CO2 Trend': sparkline.map(s => ({
          'Month': s.month,
          'Emissions (tonnes)': s.emissions
        }))
      };

      exportToExcel(sheets, 'ESG_Summary_Report.xlsx');
      toast.success('Success', 'ESG Summary exported to Excel');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate Excel export');
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = departmentScores.map(d => ({
        'Department': d.departmentName,
        'Environmental Score': d.env,
        'Social Score': d.social,
        'Governance Score': d.gov,
        'Overall Total Score': d.total
      }));

      exportToCSV(csvData, 'ESG_Department_Comparison.csv');
      toast.success('Success', 'Department scores exported to CSV');
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
            <BarChart3 size={24} className="text-[var(--blue)]" />
            ESG Summary Report
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Executive organization-wide overview of environmental, social, and governance scorecards.
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
          <Button variant="primary" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5">
            <Download size={14} />
            Export PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="flex items-center gap-1.5 border border-[var(--border)]">
            <Printer size={14} />
            Print
          </Button>
        </div>
      </div>

      {/* Org-Wide Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-2 border-t-[var(--blue)] bg-gradient-to-br from-[var(--panel)] to-[var(--blue)]/5">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Overall ESG Rating</p>
          <p className="text-4xl font-black text-[var(--text)] mt-2 font-space-grotesk">{overall.total}</p>
          <p className="text-[10px] text-[var(--muted)] mt-1.5">Simple mean of department totals</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--green)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Environmental (E)</p>
          <p className="text-3xl font-bold text-[var(--text)] mt-2 font-space-grotesk">{overall.env.toFixed(1)}</p>
          <p className="text-[10px] text-[var(--muted)] mt-1.5">Weighted {weights.env}% of Dept totals</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--blue)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Social (S)</p>
          <p className="text-3xl font-bold text-[var(--text)] mt-2 font-space-grotesk">{overall.social.toFixed(1)}</p>
          <p className="text-[10px] text-[var(--muted)] mt-1.5">Weighted {weights.social}% of Dept totals</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--purple)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Governance (G)</p>
          <p className="text-3xl font-bold text-[var(--text)] mt-2 font-space-grotesk">{overall.gov.toFixed(1)}</p>
          <p className="text-[10px] text-[var(--muted)] mt-1.5">Weighted {weights.gov}% of Dept totals</p>
        </Card>
      </div>

      {/* Weight disclosure & Executive summary */}
      <Card className="border-l-4 border-l-[var(--blue)] bg-[var(--panel2)]/30">
        <h3 className="text-sm font-bold text-[var(--text)] font-space-grotesk mb-2 uppercase tracking-wide">
          Executive Summary
        </h3>
        <p className="text-sm text-[var(--text)] leading-relaxed mb-4">
          {executiveSummary}
        </p>
        <div className="text-[11px] text-[var(--muted)] font-mono">
          * Current Score Configuration: Weighted {weights.env}% Environmental / {weights.social}% Social / {weights.gov}% Governance — Configurable in Settings.
        </div>
      </Card>

      {/* Score Comparison & Sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Comparison Table */}
        <Card padding={false} className="lg:col-span-2">
          <CardHeader className="p-5 border-b border-[var(--border)]">
            <CardTitle>Department Scorecard Performance</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--panel2)] text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Department</th>
                  <th className="px-5 py-3.5 font-semibold text-center">E-Score</th>
                  <th className="px-5 py-3.5 font-semibold text-center">S-Score</th>
                  <th className="px-5 py-3.5 font-semibold text-center">G-Score</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {departmentScores.map((dept) => {
                  let totalStatus = 'Draft';
                  if (dept.total >= 80) totalStatus = 'Active';
                  else if (dept.total >= 70) totalStatus = 'Under Review';
                  else totalStatus = 'Pending';
                  
                  return (
                    <tr key={dept.id} className="hover:bg-[var(--panel2)]/30 transition-colors">
                      <td className="px-5 py-4 font-medium text-[var(--text)]">{dept.departmentName}</td>
                      <td className="px-5 py-4 text-center text-[var(--muted)] font-mono">{dept.env.toFixed(1)}</td>
                      <td className="px-5 py-4 text-center text-[var(--muted)] font-mono">{dept.social.toFixed(1)}</td>
                      <td className="px-5 py-4 text-center text-[var(--muted)] font-mono">{dept.gov.toFixed(1)}</td>
                      <td className="px-5 py-4 text-center min-w-[120px]">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold text-[var(--text)] font-mono">{dept.total.toFixed(0)}</span>
                          <StatusPill status={totalStatus} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 12-Month CO2 Sparkline */}
        <Card padding={false}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>12-Month CO₂ Emissions Trend</CardTitle>
          </CardHeader>
          <div className="p-5">
            <p className="text-xs text-[var(--muted)] mb-4">
              Monthly sum of GHGs across all manufacturing, fleet, and corporate categories.
            </p>
            <div className="h-44 w-full">
              {sparkline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkline}>
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} width={30} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                      labelStyle={{ color: 'var(--text)' }}
                    />
                    <Area type="monotone" dataKey="emissions" stroke="var(--green)" fillOpacity={1} fill="url(#colorCo2)" strokeWidth={2} name="Emissions (t)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">No emissions trend data</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Score breakdown Chart */}
      <Card padding={false}>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Department Score Component Comparison</CardTitle>
        </CardHeader>
        <div className="h-80 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="departmentName" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Legend />
              <Bar dataKey="env" fill="var(--green)" name="Environmental" radius={[4, 4, 0, 0]} />
              <Bar dataKey="social" fill="var(--blue)" name="Social" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gov" fill="var(--purple)" name="Governance" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}