'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import StatusPill from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { Sliders, Download, Play, RefreshCw } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';

export default function CustomReportBuilder() {
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  
  // Filter states
  const [module, setModule] = useState('Environmental');
  const [range, setRange] = useState('this-year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deptId, setDeptId] = useState('');
  const [userId, setUserId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Results state
  const [results, setResults] = useState(null);
  const [querying, setQuerying] = useState(false);

  // Fetch session & filter options on load
  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, metaRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/reports/custom?meta=true')
        ]);
        
        if (meRes.ok) {
          const user = await meRes.json();
          setSession(user);
          if (user.role === 'EMPLOYEE') {
            setUserId(user.id.toString());
          }
        }
        
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setMeta(metaData);
        }
        
        setLoadingMeta(false);
      } catch (err) {
        toast.error('Error loading filters', err.message);
        setLoadingMeta(false);
      }
    }
    loadData();
  }, [toast]);

  const handleRunReport = async () => {
    setQuerying(true);
    try {
      const params = new URLSearchParams({
        module,
        range,
        startDate,
        endDate,
        deptId,
        userId: session?.role === 'EMPLOYEE' ? session.id.toString() : userId,
        challengeId,
        categoryId
      });

      const res = await fetch(`/api/reports/custom?${params.toString()}`);
      if (!res.ok) throw new Error('Query failed');
      const resData = await res.json();
      setResults(resData);
      toast.success('Query Successful', `${resData.rows.length} records fetched`);
    } catch (err) {
      toast.error('Query Failed', err.message);
    } finally {
      setQuerying(false);
    }
  };

  const handleExportPDF = () => {
    if (!results || results.rows.length === 0) return;
    try {
      const tableData = results.rows.map(row => 
        results.headers.map(h => row[h] !== null && row[h] !== undefined ? String(row[h]) : '')
      );
      
      const tables = [{
        title: `Custom Report — ${results.module} Module`,
        headers: results.headers,
        rows: tableData
      }];

      exportToPDF(`Custom ${results.module}`, tables, `Custom_${results.module}_Report.pdf`);
      toast.success('Export Successful', 'PDF generated');
    } catch (err) {
      toast.error('Export Failed', 'PDF generation failed');
    }
  };

  const handleExportExcel = () => {
    if (!results || results.rows.length === 0) return;
    try {
      const sheets = {
        'Custom Query Results': results.rows
      };
      exportToExcel(sheets, `Custom_${results.module}_Report.xlsx`);
      toast.success('Export Successful', 'Excel file generated');
    } catch (err) {
      toast.error('Export Failed', 'Excel generation failed');
    }
  };

  const handleExportCSV = () => {
    if (!results || results.rows.length === 0) return;
    try {
      exportToCSV(results.rows, `Custom_${results.module}_Report.csv`);
      toast.success('Export Successful', 'CSV file generated');
    } catch (err) {
      toast.error('Export Failed', 'CSV generation failed');
    }
  };

  if (loadingMeta) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw size={24} className="animate-spin text-[var(--blue)]" />
        <p className="text-xs text-[var(--muted)] animate-pulse">Loading filters configuration...</p>
      </Card>
    );
  }

  // Calculate totals for numeric columns
  const totals = {};
  if (results && results.rows.length > 0 && results.numericColumns) {
    results.numericColumns.forEach(col => {
      const sum = results.rows.reduce((acc, row) => {
        const val = parseFloat(row[col]);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      totals[col] = parseFloat(sum.toFixed(2));
    });
  }

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
        <Sliders size={20} className="text-[var(--blue)]" />
        <h3 className="text-lg font-bold text-[var(--text)] font-space-grotesk">
          Filter Options & Dimensions
        </h3>
      </div>

      {/* Six Dropdowns Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">Module</label>
          <Select 
            value={module} 
            onChange={(e) => {
              setModule(e.target.value);
              // Clear category/challenge when changing module
              setCategoryId('');
              setChallengeId('');
            }}
          >
            <option value="Environmental">Environmental</option>
            <option value="Social">Social</option>
            <option value="Governance">Governance</option>
            <option value="Gamification">Gamification</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">Date Range</label>
          <Select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="this-month">This Month</option>
            <option value="this-year">This Year</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">Department</label>
          <Select value={deptId} onChange={(e) => setDeptId(e.target.value)}>
            <option value="">All Departments</option>
            {meta?.departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">Employee</label>
          <Select 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)}
            disabled={session?.role === 'EMPLOYEE'}
          >
            {session?.role === 'EMPLOYEE' ? (
              <option value={session.id}>{session.name}</option>
            ) : (
              <>
                <option value="">All Employees</option>
                {meta?.employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </>
            )}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">Challenge</label>
          <Select 
            value={challengeId} 
            onChange={(e) => setChallengeId(e.target.value)}
            disabled={module !== 'Gamification'}
          >
            <option value="">All Challenges</option>
            {meta?.challenges.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">ESG Category</label>
          <Select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={module !== 'Social' && module !== 'Gamification'}
          >
            <option value="">All Categories</option>
            {meta?.categories
              .filter(cat => {
                if (module === 'Social') return cat.type === 'CSR_ACTIVITY';
                if (module === 'Gamification') return cat.type === 'CHALLENGE';
                return false;
              })
              .map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))
            }
          </Select>
        </div>
      </div>

      {/* Render Custom date inputs if Custom Range is selected */}
      {range === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--border)] pt-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1 uppercase tracking-wider">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      {/* Run Action */}
      <div className="flex justify-end pt-2">
        <Button 
          variant="primary" 
          onClick={handleRunReport} 
          loading={querying}
          className="px-6 flex items-center gap-1.5"
        >
          <Play size={14} className="fill-current" />
          Run Report
        </Button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-4 border-t border-[var(--border)] pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-[var(--text)] font-space-grotesk">
                Results Preview
              </h4>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Found {results.rows.length} records matching search dimensions.
              </p>
            </div>

            {results.rows.length > 0 && (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>

          {results.rows.length > 0 ? (
            <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--panel2)] text-xs text-[var(--muted)] uppercase border-b border-[var(--border)]">
                  <tr>
                    {results.headers.map(header => (
                      <th 
                        key={header} 
                        className={`px-5 py-3 font-semibold ${
                          results.numericColumns.includes(header) ? 'text-right' : 'text-left'
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {results.rows.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-[var(--panel2)]/30 transition-colors">
                      {results.headers.map(header => (
                        <td 
                          key={header} 
                          className={`px-5 py-3 text-[var(--muted)] ${
                            results.numericColumns.includes(header) ? 'text-right font-mono' : 'text-left'
                          }`}
                        >
                          {row[header] === 'PENDING' ? (
                            <StatusPill status="Pending" />
                          ) : row[header] === 'APPROVED' ? (
                            <StatusPill status="Completed" />
                          ) : row[header] === 'REJECTED' ? (
                            <StatusPill status="Draft" />
                          ) : row[header] === 'OPEN' ? (
                            <StatusPill status="Open" />
                          ) : row[header] === 'RESOLVED' ? (
                            <StatusPill status="Completed" />
                          ) : (
                            row[header]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {/* Totals Row */}
                  {Object.keys(totals).length > 0 && (
                    <tr className="bg-[var(--panel2)]/60 font-bold border-t border-[var(--border)]">
                      {results.headers.map((header, idx) => {
                        const isNumeric = results.numericColumns.includes(header);
                        return (
                          <td 
                            key={`total-${header}`} 
                            className={`px-5 py-3 text-[var(--text)] ${
                              isNumeric ? 'text-right font-mono' : 'text-left'
                            }`}
                          >
                            {idx === 0 ? 'Total' : isNumeric ? totals[header] : ''}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-[var(--panel2)]/10 rounded-xl border border-dashed border-[var(--border)]">
              <p className="text-sm text-[var(--muted)]">No records match the selected filter dimensions.</p>
              <p className="text-xs text-[var(--muted)]/50 mt-1">Try expanding the date range or selecting all departments.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
