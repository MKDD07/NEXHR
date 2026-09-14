import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  TrendingDown,
  CreditCard,
  Cake,
  CalendarDays,
  FileCheck,
  Send,
  ArrowUpRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { ChartCard } from '../../components/ui/ChartCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { AttendanceChart } from '../../components/charts/AttendanceChart';
import { DepartmentChart } from '../../components/charts/DepartmentChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { PayrollChart } from '../../components/charts/PayrollChart';

export function DashboardPage({
  currentUser,
  onNavigate,
  api,
  onShowToast
}) {
  const [birthdays, setBirthdays] = useState([]);
  const [reportsSummary, setReportsSummary] = useState([]);
  const [dailyReportTasks, setDailyReportTasks] = useState('');
  const [dailyReportHours, setDailyReportHours] = useState('8.5');
  const [dailyReportSubmitted, setDailyReportSubmitted] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const bRes = await api.getTodaysBirthdays();
        if (bRes.data) setBirthdays(bRes.data);

        const rRes = await api.getReportsSummary();
        if (rRes.data) setReportsSummary(rRes.data);

        const dwrRes = await api.getDailyWorkReports();
        const today = new Date().toISOString().split('T')[0];
        const hasToday = dwrRes.data?.some(
          (r) => r.userid === currentUser.userid && r.report_date === today
        );
        setDailyReportSubmitted(Boolean(hasToday));
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [api, currentUser.userid]);

  const handleDailyReportSubmit = async (e) => {
    e.preventDefault();
    if (!dailyReportTasks.trim()) return;

    setSubmittingReport(true);
    try {
      await api.submitDailyWorkReport({
        userid: currentUser.userid,
        employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
        report_date: new Date().toISOString().split('T')[0],
        project_name: 'Core Operations & Sprint Deliverables',
        tasks_completed: dailyReportTasks,
        tasks_pending: 'Review tomorrow',
        hours_spent: parseFloat(dailyReportHours) || 8.0
      });
      setDailyReportSubmitted(true);
      setDailyReportTasks('');
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Daily Report Locked',
          message: 'Report submitted and synchronized with reporting manager.'
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Submission Failed',
          message: err.message
        });
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome, ${currentUser?.first_name || 'Admin'}!`}
        subtitle="Here is today's real-time workforce analytics, shift attendance, and operational status."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={CalendarDays}
              onClick={() => onNavigate('leave')}
            >
              Leaves & Holidays
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => onNavigate('employees')}
            >
              Add Employee
            </Button>
          </div>
        }
      />

      {/* Birthday Celebration Banner (Clean Light) */}
      {birthdays.length > 0 && (
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Cake className="w-5 h-5 text-[#27292C] shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-[#27292C] flex items-center gap-2">
                Today's Company Birthdays
              </h4>
              <p className="text-xs text-[#5F6368]">
                {birthdays.map((b) => `${b.first_name} ${b.last_name} (${b.department})`).join(', ')}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (onShowToast) {
                onShowToast({
                  type: 'success',
                  title: 'Wishes Delivered',
                  message: 'Automated celebratory greeting sent to employee email.'
                });
              }
            }}
          >
            Send Greetings
          </Button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Headcount"
          value="148"
          icon={Users}
          trend={{ direction: 'up', value: '+4.2%' }}
          metaText="vs last month"
          onClick={() => onNavigate('employees')}
        />
        <StatCard
          label="Avg On-Time Check-In"
          value="94.6%"
          icon={Clock}
          trend={{ direction: 'up', value: '+1.8%' }}
          metaText="HQ & Remote geofence"
          onClick={() => onNavigate('attendance')}
        />
        <StatCard
          label="Annualized Attrition"
          value="4.2%"
          icon={TrendingDown}
          trend={{ direction: 'down', value: '-0.8%' }}
          metaText="Industry benchmark: 12%"
          onClick={() => onNavigate('reports')}
        />
        <StatCard
          label="Monthly Disbursed CTC"
          value="₹84.6 L"
          icon={CreditCard}
          trend={{ direction: 'up', value: '+3.4%' }}
          metaText="100% Tax Compliant"
          onClick={() => onNavigate('payroll')}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Compliance Weekly Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Weekly Attendance & Punctuality"
            subtitle="Real-time biometric punch and geofenced check-in ratio"
            actions={
              <Badge variant="success" icon={ShieldCheck}>
                94.6% Avg Punctuality
              </Badge>
            }
            footer={
              <div className="flex items-center justify-between w-full">
                <span>Shift Standard: 09:30 AM to 06:30 PM (15m Grace)</span>
                <button
                  type="button"
                  className="text-[#27292C] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                  onClick={() => onNavigate('attendance')}
                >
                  View Attendance History <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            }
          >
            <AttendanceChart />
          </ChartCard>
        </div>

        {/* Employment Type Donut Distribution */}
        <ChartCard
          title="Workforce Composition"
          subtitle="Distribution by work contract and mobility"
          actions={
            <span className="text-xs text-[#5F6368]">148 Employees</span>
          }
        >
          <DonutChart />
        </ChartCard>
      </div>

      {/* Secondary Row: Department Headcount & Daily Work Report Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown */}
        <ChartCard
          title="Headcount by Department"
          subtitle="Resource capacity across active organizational functions"
          actions={
            <button
              type="button"
              className="text-xs text-[#27292C] hover:underline font-medium cursor-pointer"
              onClick={() => onNavigate('employees')}
            >
              Directory →
            </button>
          }
        >
          <DepartmentChart />
        </ChartCard>

        {/* Monthly Payroll CTC Growth */}
        <ChartCard
          title="Monthly CTC Expenditure"
          subtitle="6-Month disbursed enterprise payroll trend"
          actions={
            <Badge variant="info">
              Disbursed on 31st
            </Badge>
          }
        >
          <PayrollChart />
        </ChartCard>

        {/* Quick Locked Daily Work Report Widget */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#27292C]" />
                <h3 className="text-sm font-semibold text-[#27292C]">
                  Daily Work Detail
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#F1F3F5] text-[#27292C] font-medium">
                Locked Daily Log
              </span>
            </div>
            <p className="text-xs text-[#5F6368] mb-4">
              HR Policy: Daily work reports must be logged on the active work day and cannot be edited once saved.
            </p>

            {dailyReportSubmitted ? (
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-center space-y-2 my-auto">
                <h4 className="text-sm font-semibold text-[#065F46]">
                  Today's Report Locked & Shared
                </h4>
                <p className="text-xs text-[#047857]">
                  Your work detail for today has been recorded and submitted to your reporting manager.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDailyReportSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#27292C] mb-1">
                    Key Tasks Completed Today
                  </label>
                  <textarea
                    rows={3}
                    value={dailyReportTasks}
                    onChange={(e) => setDailyReportTasks(e.target.value)}
                    placeholder="List core deliverables, sprints or modules closed..."
                    className="w-full text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#27292C] mb-1">
                      Hours Spent
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="16"
                      value={dailyReportHours}
                      onChange={(e) => setDailyReportHours(e.target.value)}
                      className="w-full text-xs h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#27292C] mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      disabled
                      value={new Date().toISOString().split('T')[0]}
                      className="w-full text-xs h-9 opacity-70 bg-[#F9FAFB]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full mt-2"
                  loading={submittingReport}
                  icon={Send}
                >
                  Submit & Lock Today's Log
                </Button>
              </form>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3F4F6] text-[11px] text-[#5F6368] flex items-center justify-between">
            <span>Reporting to: {currentUser?.manager_name || 'System Admin'}</span>
            <span className="text-[#9AA0A6]">Immutable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
