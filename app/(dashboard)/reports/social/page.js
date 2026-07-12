'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusPill from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Users, FileText, ArrowLeft, Download, Printer } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';

export default function SocialReport() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/reports/social')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch social report data');
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
        <p className="text-[var(--muted)] text-sm animate-pulse">Aggregating social metrics...</p>
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

  const { kpis, activities, diversity } = data;
  const COLORS = ['#3B82F6', '#EF4444', '#A855F7', '#22C55E', '#F97316'];

  const handleExportPDF = () => {
    try {
      const tables = [
        {
          title: 'CSR Activity Participation',
          headers: ['Activity Title', 'Category', 'Date', 'Joined', 'Approved', 'Status', 'Points'],
          rows: activities.map(act => [
            act.title,
            act.category,
            new Date(act.date).toLocaleDateString(),
            act.joined.toString(),
            act.approved.toString(),
            act.status,
            act.pointsReward.toString()
          ])
        },
        {
          title: 'Gender Diversity Representation',
          headers: ['Gender Category', 'Employee Count'],
          rows: diversity.map(d => [d.name, d.value.toString()])
        }
      ];

      const formattedKpis = {
        'Participation Rate (90d)': `${kpis.participationRate}%`,
        'Total Approved Activs': kpis.totalApprovedCount,
        'Training Completion Rate': `${kpis.trainingCompletion}%`,
        'Active Employee Pool': kpis.totalEmployees
      };

      exportToPDF('Social Impact & CSR', tables, 'Social_Report.pdf', formattedKpis);
      toast.success('Success', 'Social Report exported to PDF');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate PDF export');
    }
  };

  const handleExportExcel = () => {
    try {
      const sheets = {
        'Summary KPIs': [
          { 'Metric Name': 'CSR Participation Rate (%)', 'Value': kpis.participationRate },
          { 'Metric Name': 'Total Approved Participations', 'Value': kpis.totalApprovedCount },
          { 'Metric Name': 'Training Completion Rate (%)', 'Value': kpis.trainingCompletion },
          { 'Metric Name': 'Total Active Employees', 'Value': kpis.totalEmployees }
        ],
        'CSR Activities': activities.map(act => ({
          'Activity Title': act.title,
          'Category': act.category,
          'Date': new Date(act.date).toLocaleDateString(),
          'Joined Count': act.joined,
          'Approved Count': act.approved,
          'Status': act.status,
          'Points Reward': act.pointsReward
        })),
        'Gender Diversity': diversity.map(d => ({
          'Gender Category': d.name,
          'Count': d.value
        }))
      };

      exportToExcel(sheets, 'Social_Report.xlsx');
      toast.success('Success', 'Social Report exported to Excel');
    } catch (err) {
      toast.error('Export Failed', 'Could not generate Excel export');
    }
  };

  const handleExportCSV = () => {
    try {
      // Primary table is Activities Table
      const csvData = activities.map(act => ({
        'Activity Title': act.title,
        'Category': act.category,
        'Date': new Date(act.date).toLocaleDateString(),
        'Joined Count': act.joined,
        'Approved Count': act.approved,
        'Status': act.status,
        'Points Reward': act.pointsReward
      }));

      exportToCSV(csvData, 'Social_Activities_Report.csv');
      toast.success('Success', 'CSR Activities exported to CSV');
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
            <Users size={24} className="text-[var(--blue)]" />
            Social Report
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Diversity dashboard, CSR activity participation, training completion, and employee engagement.
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

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-2 border-t-[var(--blue)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">CSR Participation Rate</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.participationRate}%</p>
          <div className="mt-2">
            <ProgressBar value={kpis.participationRate} size="xs" color="blue" />
          </div>
        </Card>
        <Card className="border-t-2 border-t-[var(--blue)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Approved Participations</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.totalApprovedCount}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Total platform-wide</p>
        </Card>
        <Card className="border-t-2 border-t-[var(--blue)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Training Completion</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.trainingCompletion}%</p>
          <div className="mt-2">
            <ProgressBar value={kpis.trainingCompletion} size="xs" color="blue" />
          </div>
        </Card>
        <Card className="border-t-2 border-t-[var(--blue)]">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Total Active Employees</p>
          <p className="text-2xl font-bold text-[var(--text)] mt-1 font-space-grotesk">{kpis.totalEmployees}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Eligible for ESG activities</p>
        </Card>
      </div>

      {/* Charts section: Diversity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding={false} className="lg:col-span-1">
          <CardHeader className="p-5 pb-0">
            <CardTitle>Gender Representation</CardTitle>
          </CardHeader>
          <div className="h-72 p-5 flex flex-col justify-center">
            {diversity.length > 0 ? (
              <div className="relative h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diversity}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {diversity.map((entry, index) => (
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
                  {diversity.map((entry, index) => (
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
              <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">No employee diversity records</div>
            )}
          </div>
        </Card>

        {/* CSR Participation list */}
        <Card padding={false} className="lg:col-span-2">
          <CardHeader className="p-5 border-b border-[var(--border)]">
            <CardTitle>Recent CSR Activities & Approvals</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--panel2)] text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Activity</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Joined</th>
                  <th className="px-5 py-3 font-semibold text-right">Approved</th>
                  <th className="px-5 py-3 font-semibold text-center">Reward Points</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((act) => (
                    <tr key={act.id} className="hover:bg-[var(--panel2)]/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-[var(--text)]">{act.title}</td>
                      <td className="px-5 py-3 text-[var(--muted)]">{act.category}</td>
                      <td className="px-5 py-3 text-[var(--muted)] font-mono text-xs">{new Date(act.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right text-[var(--muted)] font-mono">{act.joined}</td>
                      <td className="px-5 py-3 text-right text-[var(--muted)] font-mono">{act.approved}</td>
                      <td className="px-5 py-3 text-center text-[var(--muted)] font-mono">{act.pointsReward}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          act.status === 'OPEN' ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'bg-[var(--muted)]/20 text-[var(--muted)]'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-[var(--muted)]">No activities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}