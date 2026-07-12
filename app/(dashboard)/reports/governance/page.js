'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusPill from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ShieldCheck, FileText, ArrowLeft, Download, Printer } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';

export default function GovernanceReport() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/reports/governance')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch governance report data');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--purple)]"></div>
        <p className="text-[var(--muted)] text-sm animate-pulse">Compiling governance compliance data...</p>
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

  const { kpis, policies, audits, compliance } = data;
  const COLORS = ['#EF4444', '#F97316', '#3B82F6', '#22C55E', '#A855F7'];

  const handleExportPDF = () => {
    try {
      const tables = [
        {
          title: 'Policy Acknowledgement Status',
          headers: ['Policy Title', 'Version', 'Effective Date', 'Ack Count', 'Total Employees', 'Ack %'],
          rows: policies.map(p => [
            p.title,
            p.version,
            new Date(p.effectiveDate).toLocaleDateString(),
            p.acksCount.toString(),
            p.totalEmployees.toString(),
            `${p.ackPercent}%`
          ])
        },
        {
          title: 'Compliance Audits List',
          headers: ['Audit Title', 'Department', 'Auditor', 'Date', 'Findings', 'Status'],
          rows: audits.map(a => [
            a.title,
            a.department,
            a.auditor,
            new Date(a.date).toLocaleDateString(),
            a.findings,
            a.status
          ])
        }
      ];

      const formattedKpis = {
        'Policy Ack %': `${kpis.policyAckRate}%`,
        'Completed Audits': kpis.completedAuditsCount,
        'Open Compliance Issues': kpis.openIssuesCount,
        'Overdue Issues': kpis.overdueCount,
        'Resolution Rate': `${kpis.resolutionRate}%`
      };

      exportToPDF('Governance & Compliance', tables, 'Governance_Report.pdf', formattedKpis);
      toast.success('Success', 'Governance Report exported to PDF');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate PDF export');
    }
  };

  const handleExportExcel = () => {
    try {
      const sheets = {
        'Summary KPIs': [
          { 'Metric Name': 'Policy Acknowledgement Rate (%)', 'Value': kpis.policyAckRate },
          { 'Metric Name': 'Completed Audits Count', 'Value': kpis.completedAuditsCount },
          { 'Metric Name': 'Open Compliance Issues', 'Value': kpis.openIssuesCount },
          { 'Metric Name': 'Overdue Compliance Issues', 'Value': kpis.overdueCount },
          { 'Metric Name': 'Issue Resolution Rate (%)', 'Value': kpis.resolutionRate }
        ],
        'Policy Acknowledgements': policies.map(p => ({
          'Policy Title': p.title,
          'Version': p.version,
          'Effective Date': new Date(p.effectiveDate).toLocaleDateString(),
          'Acknowledged Count': p.acksCount,
          'Total Employees': p.totalEmployees,
          'Acknowledgement %': p.ackPercent
        })),
        'Compliance Audits': audits.map(a => ({
          'Audit Title': a.title,
          'Department': a.department,
          'Auditor': a.auditor,
          'Date': new Date(a.date).toLocaleDateString(),
          'Findings': a.findings,
          'Status': a.status
        }))
      };

      exportToExcel(sheets, 'Governance_Report.xlsx');
      toast.success('Success', 'Governance Report exported to Excel');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate Excel export');
    }
  };

  const handleExportCSV = () => {
    try {
      // Primary table is Policies Table
      const csvData = policies.map(p => ({
        'Policy Title': p.title,
        'Version': p.version,
        'Effective Date': new Date(p.effectiveDate).toLocaleDateString(),
        'Acknowledged Count': p.acksCount,
        'Total Employees': p.totalEmployees,
        'Acknowledgement %': p.ackPercent
      }));

      exportToCSV(csvData, 'Governance_Policies_Report.csv');
      toast.success('Success', 'Policy status exported to CSV');
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
            <ShieldCheck size={24} className="text-[var(--purple)]" />
            Governance Report
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Policy acknowledgements, audit records, compliance issues, and risk mapping.
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
          <Button variant="purple" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5">
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-t-2 border-t-[var(--purple)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Policy Ack %</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.policyAckRate}%</p>
          <div className="mt-2">
            <ProgressBar value={kpis.policyAckRate} size="xs" color="purple" />
          </div>
        </Card>
        <Card className="border-t-2 border-t-[var(--purple)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Completed Audits</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.completedAuditsCount}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Total audits completed</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--purple)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Open Issues</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.openIssuesCount}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Requires resolution</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--purple)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Overdue Issues</p>
          <p className="text-2xl font-bold text-[var(--red)] mt-1 font-space-grotesk">{kpis.overdueCount}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Past deadline</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--purple)] col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Resolution Rate</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.resolutionRate}%</p>
          <div className="mt-2">
            <ProgressBar value={kpis.resolutionRate} size="xs" color="purple" />
          </div>
        </Card>
      </div>

      {/* Tables and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Compliance Issues by Severity chart */}
        <Card padding={false}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>Open Issues by Severity</CardTitle>
          </CardHeader>
          <div className="h-72 p-5 flex flex-col justify-center">
            {compliance.openBySeverity.some(c => c.value > 0) ? (
              <div className="relative h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compliance.openBySeverity}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {compliance.openBySeverity.map((entry, index) => (
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
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {compliance.openBySeverity.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{entry.name.toLowerCase()}</span>
                      <span className="font-semibold">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">No open compliance issues!</div>
            )}
          </div>
        </Card>

        {/* Policy Acknowledgements Table */}
        <Card padding={false} className="lg:col-span-2">
          <CardHeader className="p-5 border-b border-[var(--border)]">
            <CardTitle>Policy Acknowledgement Compliance</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--panel2)] text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Policy Title</th>
                  <th className="px-5 py-3 font-semibold">Version</th>
                  <th className="px-5 py-3 font-semibold">Effective Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Acknowledged</th>
                  <th className="px-5 py-3 font-semibold">Compliance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {policies.length > 0 ? (
                  policies.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--panel2)]/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[var(--text)]">{p.title}</td>
                      <td className="px-5 py-3.5 text-[var(--muted)] font-mono text-xs">{p.version}</td>
                      <td className="px-5 py-3.5 text-[var(--muted)] font-mono text-xs">{new Date(p.effectiveDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--muted)] font-mono">{p.acksCount} / {p.totalEmployees}</td>
                      <td className="px-5 py-3.5 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-[var(--text)] w-8 text-right">{p.ackPercent}%</span>
                          <div className="flex-1">
                            <ProgressBar value={p.ackPercent} size="xs" color="purple" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-[var(--muted)]">No policy records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Compliance Audits Table */}
      <Card padding={false}>
        <CardHeader className="p-5 border-b border-[var(--border)]">
          <CardTitle>Compliance Audits Log</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--panel2)] text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Audit Title</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Auditor</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Findings Summary</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {audits.length > 0 ? (
                audits.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--panel2)]/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-[var(--text)]">{a.title}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">{a.department}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">{a.auditor}</td>
                    <td className="px-5 py-4 text-[var(--muted)] font-mono text-xs">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-[var(--muted)] text-xs max-w-xs truncate" title={a.findings}>{a.findings}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={a.status === 'COMPLETED' ? 'Completed' : 'Pending'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-[var(--muted)]">No audits recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}