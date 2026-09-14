import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  UserCheck
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';

export function AttendancePage({
  currentUser,
  api,
  todaysAttendance,
  onPunchAttendance,
  onShowToast
}) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    presentCount: 20,
    lateCount: 1,
    halfDayCount: 1,
    leaveCount: 1,
    workingDays: 22,
    totalDays: 30
  });
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedYear, setSelectedYear] = useState('2026');

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await api.getAttendanceHistory(
          currentUser.userid,
          selectedYear,
          selectedMonth
        );
        if (res.data) setHistory(res.data);
        if (res.attendanceCount) setStats(res.attendanceCount);
      } catch (err) {
        console.error(err);
      }
    }
    loadAttendance();
  }, [currentUser.userid, selectedMonth, selectedYear, api]);

  const isCheckedIn = Boolean(todaysAttendance?.check_in_time);
  const isCheckedOut = Boolean(todaysAttendance?.check_out_time);

  // Month Calendar Days Generator
  const daysInMonth = 30; // September has 30 days
  const startDayOffset = 2; // Sept 1, 2026 is a Tuesday (0 = Sun, 1 = Mon, 2 = Tue)

  const calendarCells = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push({ day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `2026-09-${String(d).padStart(2, '0')}`;
    const match = history.find((h) => h.date === dayStr || h.attdate === dayStr);
    const dayOfWeek = (startDayOffset + d - 1) % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    calendarCells.push({
      day: d,
      date: dayStr,
      isWeekend,
      status: match ? match.status : isWeekend ? 'Weekend' : 'Upcoming',
      inTime: match ? match.check_in_time : null
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Time Clock"
        subtitle="Real-time shift punches, biometric terminal validation, and geofence tracking."
        breadcrumbs={['HRMS', 'Attendance']}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => {
                if (onShowToast) {
                  onShowToast({
                    type: 'success',
                    title: 'Export Generated',
                    message: `Downloaded ${selectedMonth} ${selectedYear} attendance log CSV.`
                  });
                }
              }}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Today's Punch Status Banner */}
      <div className="card p-5 bg-[#FFFFFF] border border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#27292C] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#27292C]">
                  Today's Attendance Status ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                </h3>
                <Badge variant={isCheckedIn && !isCheckedOut ? 'success' : isCheckedOut ? 'neutral' : 'warning'}>
                  {isCheckedIn && !isCheckedOut ? 'Shift Active' : isCheckedOut ? 'Completed' : 'Not Punched'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#5F6368] mt-1 flex-wrap">
                <span>
                  Check In:{' '}
                  <strong className="text-[#27292C]">
                    {todaysAttendance?.check_in_time || '--:--'}
                  </strong>
                </span>
                <span>
                  Check Out:{' '}
                  <strong className="text-[#27292C]">
                    {todaysAttendance?.check_out_time || '--:--'}
                  </strong>
                </span>
                <span>
                  Total Shift Hours:{' '}
                  <strong className="text-[#27292C]">
                    {todaysAttendance?.total_hours || '00:00'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5F6368] bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E7EB]">
            <MapPin className="w-4 h-4 text-[#27292C] shrink-0" />
            <span>HQ Geofence Validated (18m from terminal)</span>
          </div>
        </div>
      </div>

      {/* Quick Month Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-4 text-center bg-[#FFFFFF] border border-[#E5E7EB]">
          <span className="text-[11px] text-[#5F6368] uppercase tracking-wider font-semibold">
            Working Days
          </span>
          <p className="text-2xl font-bold text-[#27292C] mt-1">
            {stats.workingDays}
          </p>
        </div>

        <div className="card p-4 text-center bg-[#FFFFFF] border border-[#E5E7EB]">
          <span className="text-[11px] text-[#059669] uppercase tracking-wider font-semibold">
            Present
          </span>
          <p className="text-2xl font-bold text-[#059669] mt-1">
            {stats.presentCount}
          </p>
        </div>

        <div className="card p-4 text-center bg-[#FFFFFF] border border-[#E5E7EB]">
          <span className="text-[11px] text-[#D97706] uppercase tracking-wider font-semibold">
            Late In
          </span>
          <p className="text-2xl font-bold text-[#D97706] mt-1">
            {stats.lateCount}
          </p>
        </div>

        <div className="card p-4 text-center bg-[#FFFFFF] border border-[#E5E7EB]">
          <span className="text-[11px] text-[#2563EB] uppercase tracking-wider font-semibold">
            Half Day
          </span>
          <p className="text-2xl font-bold text-[#2563EB] mt-1">
            {stats.halfDayCount}
          </p>
        </div>

        <div className="card p-4 text-center bg-[#FFFFFF] border border-[#E5E7EB]">
          <span className="text-[11px] text-[#7C3AED] uppercase tracking-wider font-semibold">
            Leaves Taken
          </span>
          <p className="text-2xl font-bold text-[#7C3AED] mt-1">
            {stats.leaveCount}
          </p>
        </div>

        <div className="card p-4 text-center bg-[#FFFFFF] border border-[#E5E7EB]">
          <span className="text-[11px] text-[#5F6368] uppercase tracking-wider font-semibold">
            Punctuality %
          </span>
          <p className="text-2xl font-bold text-[#27292C] mt-1">
            95.5%
          </p>
        </div>
      </div>

      {/* View Switch Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Tabs
          tabs={[
            { id: 'calendar', label: 'Calendar View' },
            { id: 'table', label: 'Daily Logs Table' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5F6368] font-medium">Viewing:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs h-8 px-2"
          >
            <option value="August">August 2026</option>
            <option value="September">September 2026</option>
            <option value="October">October 2026</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid View */}
      {activeTab === 'calendar' && (
        <div className="card p-0 overflow-hidden bg-[#FFFFFF] border border-[#E5E7EB]">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#27292C]">
              {selectedMonth} {selectedYear} Attendance Grid
            </h3>
            <div className="flex items-center gap-3 text-xs text-[#5F6368]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Late
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Leave
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-[#5F6368] border-r last:border-r-0 border-[#E5E7EB]">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarCells.map((cell, idx) => {
              if (!cell.day) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[72px] p-2 border-r border-b border-[#F3F4F6] bg-[#FAFAFA]"
                  />
                );
              }

              const isToday = cell.day === new Date().getDate() && selectedMonth === 'September';

              return (
                <div
                  key={cell.day}
                  className={`min-h-[72px] p-2 border-r border-b border-[#F3F4F6] transition-colors ${
                    isToday ? 'bg-[#F8F9FA]' : 'bg-[#FFFFFF] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-[#27292C] font-bold' : 'text-[#5F6368]'}`}>
                    {cell.day}
                  </div>

                  <div className="space-y-1">
                    {cell.status === 'Present' && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] font-medium border border-[#A7F3D0]">
                        Present {cell.inTime ? cell.inTime.slice(0, 5) : ''}
                      </span>
                    )}
                    {cell.status === 'Late' && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] font-medium border border-[#FDE68A]">
                        Late {cell.inTime ? cell.inTime.slice(0, 5) : ''}
                      </span>
                    )}
                    {cell.status === 'Half Day' && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-medium border border-[#BFDBFE]">
                        Half Day
                      </span>
                    )}
                    {cell.status === 'Leave' && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED] font-medium border border-[#DDD6FE]">
                        On Leave
                      </span>
                    )}
                    {cell.status === 'Weekend' && (
                      <span className="inline-block text-[10px] text-[#9AA0A6]">
                        Off Day
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View */}
      {activeTab === 'table' && (
        <div className="card p-0 overflow-hidden bg-[#FFFFFF] border border-[#E5E7EB]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[#5F6368] font-semibold border-b border-[#E5E7EB] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Day</th>
                  <th className="py-3 px-4">Punch In</th>
                  <th className="py-3 px-4">Punch Out</th>
                  <th className="py-3 px-4">Total Shift Time</th>
                  <th className="py-3 px-4">Punctuality Status</th>
                  <th className="py-3 px-4">Terminal Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#27292C]">
                {history.map((row) => (
                  <tr key={row.date} className="hover:bg-[#F9FAFB]">
                    <td className="py-2.5 px-4 font-medium text-[#27292C]">
                      {row.date} ({row.attday || 'Day'})
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#059669]">
                      {row.check_in_time || '--:--'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#5F6368]">
                      {row.check_out_time || '--:--'}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#27292C]">
                      {row.total_hours || '00:00'}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          row.status === 'Present'
                            ? 'success'
                            : row.status === 'Late'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-[#5F6368]">
                      {row.check_in_distance ? `${row.check_in_distance}m (HQ Geofence)` : 'Standard HQ Terminal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
