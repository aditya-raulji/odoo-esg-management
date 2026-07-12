'use client';

import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Users, GraduationCap, Percent, Award } from 'lucide-react';

export default function DiversityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/diversity');
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error('Failed to load diversity metrics');
      }
    } catch {
      toast.error('Network error while loading metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const BLUE_COLORS = ['#3B82F6', '#2563EB', '#60A5FA', '#1D4ED8', '#93C5FD'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Diversity &amp; Training Dashboard</h1>
        <p className="text-sm text-[var(--muted)]">Representation, department participation, and training completion rates.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--muted)]">Loading dashboard data...</div>
      ) : !data ? (
        <div className="text-center py-20 text-[var(--muted)]">No dashboard metrics available.</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Total Headcount</span>
                  <h3 className="text-3xl font-extrabold text-[var(--text)] font-space">
                    {data.trainingCompletion?.total || 0}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">Active employee profiles</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center border border-[var(--blue)]/20">
                  <Users size={22} />
                </div>
              </div>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Training Completion Rate</span>
                  <h3 className="text-3xl font-extrabold text-[var(--text)] font-space">
                    {data.trainingCompletion?.value || 0}%
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    {data.trainingCompletion?.count || 0} / {data.trainingCompletion?.total || 0} employees trained
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                  <GraduationCap size={22} />
                </div>
              </div>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Overall CSR Activity Count</span>
                  <h3 className="text-3xl font-extrabold text-[var(--text)] font-space">
                    {data.departments?.reduce((sum, d) => sum + d.approvedParticipations, 0) || 0}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">Approved CSR participations</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 text-[var(--orange)] flex items-center justify-center border border-[var(--orange)]/20">
                  <Award size={22} />
                </div>
              </div>
            </Card>
          </div>

          {/* Progress / KPI Tile Detail */}
          <Card className="border border-[var(--border)] bg-[var(--panel)]">
            <div className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-[var(--text)] font-space uppercase tracking-wider">CSR Training Program Progress</h3>
              <ProgressBar value={data.trainingCompletion?.value || 0} max={100} showPercent={true} className="h-2 bg-[var(--border)]" />
              <p className="text-xs text-[var(--muted)]">
                Shows percentage of unique employee profiles who have completed at least one educational workshop or sustainability seminar inside the <strong>Training</strong> CSR activity category.
              </p>
            </div>
          </Card>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender Split Donut */}
            <Card padding={false} className="border border-[var(--border)] bg-[var(--panel)]">
              <CardHeader className="p-5 pb-0">
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <div className="h-64 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.genders}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.genders?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BLUE_COLORS[index % BLUE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--panel2)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)'
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Employees per Department */}
            <Card padding={false} className="border border-[var(--border)] bg-[var(--panel)]">
              <CardHeader className="p-5 pb-0">
                <CardTitle>Headcount by Department</CardTitle>
              </CardHeader>
              <div className="h-64 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--panel2)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)'
                      }}
                    />
                    <Bar dataKey="employees" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Employees Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 gap-6">
            {/* CSR Participation Rate per Department */}
            <Card padding={false} className="border border-[var(--border)] bg-[var(--panel)]">
              <CardHeader className="p-5 pb-0">
                <CardTitle>CSR Participation Rate per Department (%)</CardTitle>
              </CardHeader>
              <div className="h-72 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Participation Rate']}
                      contentStyle={{
                        backgroundColor: 'var(--panel2)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)'
                      }}
                    />
                    <Bar dataKey="participationRate" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Participation Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}