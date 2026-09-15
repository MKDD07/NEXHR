import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Briefcase,
  TrendingDown,
  Calendar,
  CreditCard,
  FileText,
  ChevronRight,
  Filter,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Building2,
  Bell,
  Info,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { ChartCard } from '../../components/ui/ChartCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton, SkeletonWidget } from '../../components/ui/Skeleton';
import { R2_PROFILE_IMAGES } from '../../lib/api';

// Tenant ID scope for queries
const TENANT_ID = 'hrtiva_ent_01';
const TENANT_NAME = 'HRTiva Enterprise';

export function DashboardPage({
  currentUser,
  onNavigate,
  api,
  onShowToast
}) {
  // Global dashboard refresh timestamp (15-min cache simulation)
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Independent widget loading states
  const [kpiLoading, setKpiLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [recruitmentLoading, setRecruitmentLoading] = useState(false);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Independent widget error states
  const [attendanceError, setAttendanceError] = useState(null);
  const [approvalsError, setApprovalsError] = useState(null);
  const [leaveError, setLeaveError] = useState(null);
  const [payrollError, setPayrollError] = useState(null);

  // Widget 2: Approvals Queue State (Verified Enterprise Personnel with Cloudflare R2 Images)
  const [approvalsQueue, setApprovalsQueue] = useState([
    {
      id: 'appr-1',
      requester_name: 'Mohit Kataria',
      userid: 'TYS-1021',
      avatar_src: R2_PROFILE_IMAGES['TYS-1021'],
      type: 'Leave',
      details: 'Casual Leave (2 days)',
      date_requested: '2026-09-14',
      days_pending: 1,
      department: 'Engineering & Technology'
    },
    {
      id: 'appr-2',
      requester_name: 'Rajesh Sharma',
      userid: 'TYS-1008',
      avatar_src: R2_PROFILE_IMAGES['TYS-1008'],
      type: 'Regularization',
      details: 'Missed Biometric Punch-In (Sep 12)',
      date_requested: '2026-09-12',
      days_pending: 2,
      department: 'Engineering & Technology'
    },
    {
      id: 'appr-3',
      requester_name: 'Ananya Deshmukh',
      userid: 'TYS-1005',
      avatar_src: R2_PROFILE_IMAGES['TYS-1005'],
      type: 'Expense',
      details: 'Cloudflare Worker Pro Enterprise Tier (₹14,500)',
      date_requested: '2026-09-13',
      days_pending: 1,
      department: 'Engineering & Technology'
    },
    {
      id: 'appr-4',
      requester_name: 'Priyanka Chopra',
      userid: 'TYS-1003',
      avatar_src: R2_PROFILE_IMAGES['TYS-1003'],
      type: 'Leave',
      details: 'Paid Leave (1 day)',
      date_requested: '2026-09-13',
      days_pending: 1,
      department: 'Human Resources'
    }
  ]);

  // Widget 5: Leave Calendar State (Verified enterprise personnel only)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [leaveList, setLeaveList] = useState([
    {
      id: 'lv-1',
      name: 'Mohit Kataria',
      department: 'Engineering & Technology',
      leave_type: 'Casual Leave',
      dates: 'Sep 22 - Sep 23',
      days: 2,
      status: 'Approved'
    },
    {
      id: 'lv-2',
      name: 'Rajesh Sharma',
      department: 'Engineering & Technology',
      leave_type: 'Paid Leave',
      dates: 'Sep 28 - Sep 30',
      days: 3,
      status: 'Pending'
    },
    {
      id: 'lv-3',
      name: 'Ananya Deshmukh',
      department: 'Engineering & Technology',
      leave_type: 'Sick Leave',
      dates: 'Sep 14 - Sep 15',
      days: 2,
      status: 'Approved'
    },
    {
      id: 'lv-4',
      name: 'Priyanka Chopra',
      department: 'Human Resources',
      leave_type: 'Half Day',
      dates: 'Sep 18 (Afternoon)',
      days: 0.5,
      status: 'Approved'
    }
  ]);

  // Handle Master Refresh
  const handleRefreshDashboard = async () => {
    setIsRefreshing(true);
    setKpiLoading(true);
    setAttendanceLoading(true);
    setApprovalsLoading(true);
    setLeaveLoading(true);

    try {
      if (api?.getAllUsers) {
        await api.getAllUsers();
      }
      setLastRefreshed(new Date());
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Dashboard Synchronized',
          message: `Aggregated data refreshed for ${TENANT_NAME}.`
        });
      }
    } catch (e) {
      console.warn('Dashboard sync note:', e);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setKpiLoading(false);
        setAttendanceLoading(false);
        setApprovalsLoading(false);
        setLeaveLoading(false);
      }, 400);
    }
  };

  // Inline Approval Action
  const handleApprovalAction = (id, action) => {
    const item = approvalsQueue.find((a) => a.id === id);
    if (!item) return;

    setApprovalsQueue((prev) => prev.filter((a) => a.id !== id));

    if (onShowToast) {
      onShowToast({
        type: action === 'approve' ? 'success' : 'info',
        title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        message: `${item.type} request from ${item.requester_name} has been ${action === 'approve' ? 'approved' : 'rejected'}.`
      });
    }
  };

  // Filtered leaves by department
  const filteredLeaves = selectedDeptFilter === 'All'
    ? leaveList
    : leaveList.filter((l) => l.department.toLowerCase().includes(selectedDeptFilter.toLowerCase()));

  // 7-day attendance trend data
  const attendanceTrendData = [
    { day: 'Mon', date: 'Sep 08', presentRate: 95.2, presentCount: 141, onTimeRate: 96.0 },
    { day: 'Tue', date: 'Sep 09', presentRate: 96.0, presentCount: 142, onTimeRate: 95.5 },
    { day: 'Wed', date: 'Sep 10', presentRate: 94.8, presentCount: 140, onTimeRate: 94.2 },
    { day: 'Thu', date: 'Sep 11', presentRate: 95.5, presentCount: 141, onTimeRate: 96.8 },
    { day: 'Fri', date: 'Sep 12', presentRate: 94.2, presentCount: 139, onTimeRate: 93.8 },
    { day: 'Mon', date: 'Sep 14', presentRate: 94.6, presentCount: 140, onTimeRate: 94.6 },
    { day: 'Today', date: 'Live', presentRate: 94.6, presentCount: 140, onTimeRate: 94.6 }
  ];

  // Department distribution
  const departmentBreakdown = [
    { name: 'Engineering & Technology', count: 68, percentage: 46, color: '#27292C' },
    { name: 'Human Resources & Talent', count: 24, percentage: 16, color: '#4B5563' },
    { name: 'Product & UX Design', count: 22, percentage: 15, color: '#6B7280' },
    { name: 'Sales & Customer Success', count: 19, percentage: 13, color: '#9CA3AF' },
    { name: 'Finance & Legal Operations', count: 15, percentage: 10, color: '#D1D5DB' }
  ];

  // Recruitment funnel stages
  const recruitmentFunnel = [
    { stage: 'Applied', count: 48, delta: '+12', color: '#F3F4F6' },
    { stage: 'Screened', count: 26, delta: '+8', color: '#E5E7EB' },
    { stage: 'Interview', count: 14, delta: '+3', color: '#D1D5DB' },
    { stage: 'Offer', count: 5, delta: '+2', color: '#9CA3AF' },
    { stage: 'Hired', count: 3, delta: '+1', color: '#10B981' }
  ];

  return (
    <div id="tenant-admin-dashboard" className="space-y-6">
      {/* Top Welcome & Master Refresh Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl font-bold text-[#27292C] tracking-tight">
            Tenant Admin Console
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Operational cockpit for <strong className="text-[#27292C]">{TENANT_NAME}</strong> (Tenant ID: <code className="font-mono text-[11px] text-[#27292C]">{TENANT_ID}</code>)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#5F6368] hidden sm:inline-block">
            Cache TTL 15m • Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button
            id="btn-refresh-dashboard"
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={isRefreshing}
            onClick={handleRefreshDashboard}
            title="Refresh aggregate metrics"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards (Row of 5) */}
      {/* Mobile: horizontally scrollable row. Desktop: 5-column grid */}
      <div id="section-kpi-cards">
        <div className="flex overflow-x-auto pb-2 snap-x sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-4 no-scrollbar">
          {/* Card 1: Total Headcount */}
          <div className="min-w-[220px] sm:min-w-0 snap-start flex-1">
            <StatCard
              id="kpi-total-headcount"
              label="Total Headcount"
              value="148"
              icon={Users}
              trend={{ direction: 'up', value: '+6' }}
              metaText="this month"
              onClick={() => onNavigate('employees')}
              className="hover:border-[#27292C] transition-colors cursor-pointer"
            />
          </div>

          {/* Card 2: Present Today */}
          <div className="min-w-[220px] sm:min-w-0 snap-start flex-1">
            <StatCard
              id="kpi-present-today"
              label="Present Today"
              value="94.6% (140)"
              icon={Clock}
              trend={{ direction: 'up', value: 'vs 4 absent' }}
              metaText="4 on leave"
              onClick={() => onNavigate('attendance')}
              className="hover:border-[#27292C] transition-colors cursor-pointer"
            />
          </div>

          {/* Card 3: Pending Approvals */}
          <div className="min-w-[220px] sm:min-w-0 snap-start flex-1">
            <StatCard
              id="kpi-pending-approvals"
              label="Pending Approvals"
              value={approvalsQueue.length.toString()}
              icon={AlertCircle}
              trend={{ direction: 'neutral', value: '3 leave' }}
              metaText="2 reg • 2 exp"
              onClick={() => onNavigate('leave')}
              className="hover:border-[#27292C] transition-colors cursor-pointer"
            />
          </div>

          {/* Card 4: Open Positions */}
          <div className="min-w-[220px] sm:min-w-0 snap-start flex-1">
            <StatCard
              id="kpi-open-positions"
              label="Open Positions"
              value="5"
              icon={Briefcase}
              trend={{ direction: 'up', value: '41 candidates' }}
              metaText="in pipeline"
              onClick={() => onNavigate('recruitment')}
              className="hover:border-[#27292C] transition-colors cursor-pointer"
            />
          </div>

          {/* Card 5: Attrition Rate */}
          <div className="min-w-[220px] sm:min-w-0 snap-start flex-1">
            <StatCard
              id="kpi-attrition-rate"
              label="Attrition Rate"
              value="3.8%"
              icon={TrendingDown}
              trend={{ direction: 'down', value: '-0.6%' }}
              metaText="trailing 3-month"
              onClick={() => onNavigate('reports')}
              className="hover:border-[#27292C] transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main 3-Column Responsive Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* =========================================================================
            3. ATTENDANCE SNAPSHOT (WIDGET) - Col Span 2 on Desktop
        ========================================================================== */}
        <div id="widget-attendance-snapshot" className="lg:col-span-2">
          <ChartCard
            title="Attendance Snapshot & 7-Day Trend"
            subtitle="Real-time shift presence and historical punctuality rollup"
            actions={
              <button
                type="button"
                id="link-view-full-attendance"
                onClick={() => onNavigate('attendance')}
                className="text-xs font-semibold text-[#27292C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View full attendance <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {attendanceLoading ? (
              <SkeletonWidget />
            ) : attendanceError ? (
              <div className="p-6 text-center text-xs text-[#DC2626] bg-[#FEF2F2] rounded-xl border border-[#FCA5A5]">
                <p>{attendanceError}</p>
                <Button size="sm" variant="secondary" className="mt-2" onClick={() => setAttendanceError(null)}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Today's Breakdown Bars */}
                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#27292C]">
                      Today's Roster Composition (148 Total)
                    </span>
                    <Badge variant="success" icon={ShieldCheck}>
                      94.6% On-Time Check-In
                    </Badge>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-[#E5E7EB] overflow-hidden flex">
                    <div
                      style={{ width: '94.6%' }}
                      className="bg-[#10B981] h-full"
                      title="140 Present (94.6%)"
                    />
                    <div
                      style={{ width: '2.7%' }}
                      className="bg-[#EF4444] h-full"
                      title="4 Absent (2.7%)"
                    />
                    <div
                      style={{ width: '2.7%' }}
                      className="bg-[#F59E0B] h-full"
                      title="4 On Leave (2.7%)"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#E5E7EB] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-[#27292C] font-semibold">140</span>
                      <span className="text-[#5F6368]">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      <span className="text-[#27292C] font-semibold">4</span>
                      <span className="text-[#5F6368]">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-[#27292C] font-semibold">4</span>
                      <span className="text-[#5F6368]">On Leave</span>
                    </div>
                  </div>
                </div>

                {/* 7-Day Attendance Trend Line Table / Rollup */}
                <div>
                  <h4 className="text-xs font-semibold text-[#27292C] mb-2 uppercase tracking-wider">
                    7-Day Pre-Aggregated Attendance Rollup
                  </h4>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {attendanceTrendData.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-xs transition-colors ${
                          item.day === 'Today'
                            ? 'bg-[#27292C] text-[#FFFFFF] border-[#27292C]'
                            : 'bg-[#FFFFFF] text-[#27292C] border-[#E5E7EB]'
                        }`}
                      >
                        <p className={`text-[11px] font-semibold ${item.day === 'Today' ? 'text-[#9CA3AF]' : 'text-[#5F6368]'}`}>
                          {item.day}
                        </p>
                        <p className="text-[10px] opacity-70">{item.date}</p>
                        <p className="font-bold text-sm mt-1">{item.presentRate}%</p>
                        <p className={`text-[10px] mt-0.5 ${item.day === 'Today' ? 'text-[#34D399]' : 'text-[#059669]'}`}>
                          {item.presentCount} in
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        {/* =========================================================================
            4. APPROVALS QUEUE (WIDGET) - Col Span 1
        ========================================================================== */}
        <div id="widget-approvals-queue" className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#27292C]" />
                <h3 className="text-sm font-semibold text-[#27292C]">Approvals Queue</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  {approvalsQueue.length} Pending
                </span>
                <button
                  type="button"
                  id="link-view-all-approvals"
                  onClick={() => onNavigate('leave')}
                  className="text-xs text-[#27292C] hover:underline font-medium cursor-pointer"
                >
                  View all
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#5F6368] mt-2 mb-3">
              Sorted by oldest pending request first. Max 5 displayed inline.
            </p>

            {approvalsLoading ? (
              <SkeletonWidget />
            ) : approvalsQueue.length === 0 ? (
              <EmptyState
                id="empty-state-approvals"
                title="All caught up!"
                description="There are currently no pending leave, regularization, or expense approvals awaiting tenant sign-off."
                icon={CheckCircle2}
                className="my-3 py-6"
              />
            ) : (
              <div className="space-y-2.5">
                {approvalsQueue.slice(0, 5).map((appr) => (
                  <div
                    key={appr.id}
                    id={`approval-row-${appr.id}`}
                    className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={appr.requester_name} src={appr.avatar_src} size="sm" avatarId={appr.avatar_id} />
                        <div>
                          <p className="text-xs font-semibold text-[#27292C] leading-tight">
                            {appr.requester_name}
                          </p>
                          <p className="text-[11px] text-[#5F6368]">
                            {appr.department}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#27292C]">
                        {appr.type}
                      </span>
                    </div>

                    <div className="text-xs text-[#5F6368] flex items-center justify-between">
                      <span className="truncate pr-2 font-medium text-[#27292C]">{appr.details}</span>
                      <span className="text-[11px] font-mono text-[#DC2626] shrink-0 font-medium">
                        {appr.days_pending}d pending
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[#F3F4F6]">
                      <Button
                        id={`btn-approve-${appr.id}`}
                        size="xs"
                        variant="primary"
                        className="flex-1 bg-[#10B981] hover:bg-[#059669] border-[#10B981] text-[#FFFFFF]"
                        icon={Check}
                        onClick={() => handleApprovalAction(appr.id, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        id={`btn-reject-${appr.id}`}
                        size="xs"
                        variant="secondary"
                        className="flex-1 hover:border-[#FCA5A5] hover:text-[#DC2626]"
                        icon={X}
                        onClick={() => handleApprovalAction(appr.id, 'reject')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3F4F6] text-[11px] text-[#5F6368] flex items-center justify-between">
            <span>Workflow: Tenant Admin Authority</span>
            <span className="font-mono text-[#27292C]">SLA: 24h</span>
          </div>
        </div>

        {/* =========================================================================
            5. LEAVE CALENDAR (WIDGET) - Col Span 1
        ========================================================================== */}
        <div id="widget-leave-calendar" className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#27292C]" />
                <h3 className="text-sm font-semibold text-[#27292C]">Leave Calendar</h3>
              </div>
              <span className="text-xs text-[#5F6368]">This Week</span>
            </div>

            {/* Department Filter Selector */}
            <div className="flex items-center gap-1.5 my-3 overflow-x-auto pb-1 no-scrollbar">
              {['All', 'Engineering', 'Human Resources', 'Product & Design'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  id={`filter-dept-${dept.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedDeptFilter(dept)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedDeptFilter === dept
                      ? 'bg-[#27292C] text-[#FFFFFF]'
                      : 'bg-[#F3F4F6] text-[#5F6368] hover:bg-[#E5E7EB]'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {leaveLoading ? (
              <SkeletonWidget />
            ) : filteredLeaves.length === 0 ? (
              <EmptyState
                id="empty-state-leaves"
                title="No leaves this week"
                description={`No employees from ${selectedDeptFilter} are scheduled on leave this week.`}
                icon={Calendar}
                className="my-3 py-6"
              />
            ) : (
              <div className="space-y-2.5">
                {filteredLeaves.map((item) => (
                  <div
                    key={item.id}
                    id={`leave-row-${item.id}`}
                    className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={item.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#27292C] truncate leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#5F6368] truncate">
                          {item.department}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-medium text-[#27292C] block">
                        {item.dates}
                      </span>
                      <span className="text-[10px] text-[#5F6368]">
                        {item.leave_type} ({item.days}d)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            id="btn-navigate-leave-module"
            onClick={() => onNavigate('leave')}
            className="mt-4 pt-3 border-t border-[#F3F4F6] text-xs text-[#27292C] font-semibold hover:underline flex items-center justify-between w-full cursor-pointer"
          >
            <span>Open Leave Management Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* =========================================================================
            6. RECRUITMENT FUNNEL (WIDGET) - Col Span 1 or 2
        ========================================================================== */}
        <div id="widget-recruitment-funnel" className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#27292C]" />
                <h3 className="text-sm font-semibold text-[#27292C]">Recruitment Funnel</h3>
              </div>
              <Badge variant="info">41 In Pipeline</Badge>
            </div>

            <p className="text-xs text-[#5F6368] mt-2 mb-4">
              Horizontal stage progression: Applied → Screened → Interview → Offer → Hired
            </p>

            {recruitmentLoading ? (
              <SkeletonWidget />
            ) : (
              <div className="space-y-4">
                {/* Horizontal Funnel Blocks */}
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {recruitmentFunnel.map((step, idx) => (
                    <div
                      key={step.stage}
                      id={`funnel-stage-${step.stage.toLowerCase()}`}
                      className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-medium text-[#5F6368] truncate">
                        {step.stage}
                      </span>
                      <p className="text-base font-bold text-[#27292C] my-1 font-mono">
                        {step.count}
                      </p>
                      <span className="text-[10px] font-semibold text-[#10B981]">
                        {step.delta}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Funnel Conversion Metrics */}
                <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5F6368]">Screen-to-Interview Conversion</span>
                    <span className="font-semibold text-[#27292C]">53.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5F6368]">Offer Acceptance Ratio</span>
                    <span className="font-semibold text-[#10B981]">85.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5F6368]">Avg Time to Fill</span>
                    <span className="font-semibold text-[#27292C]">24 Days</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            id="btn-navigate-recruitment-module"
            onClick={() => onNavigate('recruitment')}
            className="mt-4 pt-3 border-t border-[#F3F4F6] text-xs text-[#27292C] font-semibold hover:underline flex items-center justify-between w-full cursor-pointer"
          >
            <span>View 5 Active Job Openings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* =========================================================================
            7. PAYROLL STATUS (WIDGET) - Col Span 1
        ========================================================================== */}
        <div id="widget-payroll-status" className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#27292C]" />
                <h3 className="text-sm font-semibold text-[#27292C]">Payroll Status</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                Under Review
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <span className="text-[11px] text-[#5F6368]">Next Disbursal Run</span>
                <p className="text-base font-bold text-[#27292C] mt-0.5">
                  September 30, 2026
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5E7EB] text-xs">
                  <span className="text-[#5F6368]">Scheduled CTC</span>
                  <span className="font-bold text-[#27292C]">₹84,60,000</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-[#5F6368]">Employees Covered</span>
                  <span className="font-medium text-[#27292C]">148 Active</span>
                </div>
              </div>

              {/* Compliance Deadline Warning Alert */}
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-2.5 text-xs text-[#991B1B]">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#991B1B]">Compliance Filing Alert</p>
                  <p className="text-[11px] text-[#B91C1C] mt-0.5 leading-relaxed">
                    Statutory PF, ESI, and TDS monthly challan filing deadline is approaching in <strong>4 days</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="btn-navigate-payroll-module"
            onClick={() => onNavigate('payroll')}
            className="mt-4 pt-3 border-t border-[#F3F4F6] text-xs text-[#27292C] font-semibold hover:underline flex items-center justify-between w-full cursor-pointer"
          >
            <span>Open Payroll Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* =========================================================================
            8. ORG ANNOUNCEMENTS / ALERTS PANEL - Col Span 1 or 2
        ========================================================================== */}
        <div id="widget-org-announcements-alerts" className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#27292C]" />
                <h3 className="text-sm font-semibold text-[#27292C]">Org Alerts & Announcements</h3>
              </div>
              <Badge variant="warning">Action Required</Badge>
            </div>

            <div className="mt-3 space-y-2.5">
              {/* Alert 1: Documents Expiring Soon */}
              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-start gap-2.5 text-xs">
                <FileText className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#27292C]">Contract Renewal Due</span>
                    <span className="text-[10px] font-mono text-[#F59E0B] font-semibold">14d left</span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">
                    2 consultant master service agreements expiring on Sep 28.
                  </p>
                </div>
              </div>

              {/* Alert 2: Probation Ending this week */}
              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-start gap-2.5 text-xs">
                <Users className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#27292C]">Probation Ending This Week</span>
                    <span className="text-[10px] font-mono text-[#3B82F6] font-semibold">Sep 18</span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">
                    Rahul Mehta (QA Engineer) completes 90-day review cycle.
                  </p>
                </div>
              </div>

              {/* Alert 3: Performance Review Cycle */}
              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-start gap-2.5 text-xs">
                <Clock className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#27292C]">Q3 Appraisal Ratings Lock</span>
                    <span className="text-[10px] font-mono text-[#8B5CF6] font-semibold">Sep 30</span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">
                    Quarterly manager performance reviews lock on September 30.
                  </p>
                </div>
              </div>

              {/* Alert 4: Super Admin Platform Notice */}
              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-[#27292C] block">
                    Cloudflare D1 SQL Schema Synced
                  </span>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">
                    Database index optimization completed; biometric geofence perimeter active.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3F4F6] text-[11px] text-[#5F6368] flex items-center justify-between">
            <span>4 alerts monitored across tenant</span>
            <button
              type="button"
              className="font-medium text-[#27292C] hover:underline cursor-pointer"
              onClick={() => onNavigate('documents')}
            >
              Vault →
            </button>
          </div>
        </div>

        {/* =========================================================================
            9. DEPARTMENT BREAKDOWN (WIDGET) - Col Span 1 or 2
        ========================================================================== */}
        <div id="widget-department-breakdown" className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#27292C]" />
                <h3 className="text-sm font-semibold text-[#27292C]">Department Breakdown</h3>
              </div>
              <button
                type="button"
                id="link-view-all-employees"
                onClick={() => onNavigate('employees')}
                className="text-xs text-[#27292C] hover:underline font-semibold cursor-pointer"
              >
                Directory →
              </button>
            </div>

            <p className="text-xs text-[#5F6368] mt-2 mb-3">
              Headcount distribution across active organizational units. Click to inspect.
            </p>

            <div className="space-y-3">
              {departmentBreakdown.map((dept) => (
                <div
                  key={dept.name}
                  id={`dept-row-${dept.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onNavigate('employees')}
                  className="p-2 rounded-lg hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#27292C]">{dept.name}</span>
                    <span className="font-mono text-[#5F6368]">
                      {dept.count} <span className="text-[11px] text-[#9CA3AF]">({dept.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#27292C]"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3F4F6] text-[11px] text-[#5F6368] flex items-center justify-between">
            <span>5 Functional Divisions</span>
            <span className="font-semibold text-[#27292C]">148 Total Workforce</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
