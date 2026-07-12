'use client';
import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function DiversityPage() {
  const [genderData, setGenderData] = useState([]);
  const [roleData, setRoleData] = useState([]);

  useEffect(() => {
    fetch('/api/social/diversity')
      .then(res => res.json())
      .then(d => {
        setGenderData(d.genders);
        setRoleData(d.roles);
      });
  }, []);

  const COLORS = ['var(--blue)', 'var(--green)', 'var(--purple)', 'var(--orange)'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Diversity Dashboard</h1>
        <p className="text-sm text-[var(--muted)]">Gender and role representation across the organization.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding={false}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <div className="h-64 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card padding={false}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <div className="h-64 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}