import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  UserCheck,
  Send
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';

export function LeavePage({
  currentUser,
  api,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('my-leaves');
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [balance, setBalance] = useState({ total_leave: '18', bal_leave: '16' });

  // Apply Leave Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionRemark, setRejectionRemark] = useState('');

  const loadLeaves = async () => {
    try {
      const myRes = await api.getLeaves(currentUser.userid);
      if (myRes.data) setMyLeaves(myRes.data);

      const balRes = await api.getLeaveStatus(currentUser.userid);
      if (balRes.data?.[0]) setBalance(balRes.data[0]);

      const teamRes = await api.getTeamLeaves();
      if (teamRes.data) setTeamLeaves(teamRes.data);

      const hRes = await api.getHolidays();
      if (hRes.data) setHolidays(hRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [currentUser.userid]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    setSubmitting(true);
    try {
      await api.applyLeave({
        userid: currentUser.userid,
        email: currentUser.email,
        employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
        leave_type: leaveType,
        applicant_role: currentUser.type || 'Employee',
        start_date: startDate,
        end_date: endDate,
        reason
      });

      setIsApplyModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      await loadLeaves();

      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Leave Applied',
          message: 'Your leave application was submitted for hierarchical approval.'
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Application Error',
          message: err.message
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAction = async (leaveId, action, remark = '') => {
    try {
      await api.reviewLeave({
        leave_id: leaveId,
        status: action,
        approver_userid: currentUser.userid,
        approver_name: `${currentUser.first_name} ${currentUser.last_name}`,
        remark
      });
      await loadLeaves();
      if (onShowToast) {
        onShowToast({
          type: action === 'Approved' ? 'success' : 'warning',
          title: `Leave ${action}`,
          message: `Application ${action.toLowerCase()} successfully.`
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Action Failed',
          message: err.message
        });
      }
    }
  };

  const isHRorAdmin =
    (currentUser.type || '').toLowerCase().includes('admin') ||
    (currentUser.type || '').toLowerCase().includes('manager');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Submit time-off requests, track balance quota, and review team approvals."
        breadcrumbs={['HRMS', 'Leaves']}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsApplyModalOpen(true)}
          >
            Apply for Leave
          </Button>
        }
      />

      {/* Leave Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <span className="text-xs text-slate-400 font-medium">Total Annual Quota</span>
          <p className="text-2xl font-bold text-white font-display mt-1">
            {balance.total_leave} Days
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Annual paid leave allotment
          </span>
        </div>

        <div className="card p-4 border-emerald-500/20 bg-emerald-950/10">
          <span className="text-xs text-emerald-400 font-medium">Available Balance</span>
          <p className="text-2xl font-bold text-emerald-400 font-display mt-1">
            {balance.bal_leave} Days
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Eligible for immediate encashment or application
          </span>
        </div>

        <div className="card p-4">
          <span className="text-xs text-indigo-400 font-medium">Approved Leaves</span>
          <p className="text-2xl font-bold text-indigo-400 font-display mt-1">
            {myLeaves.filter((l) => l.status === 'Approved').length} Requests
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Recorded in attendance calendar
          </span>
        </div>

        <div className="card p-4 border-amber-500/20 bg-amber-950/10">
          <span className="text-xs text-amber-400 font-medium">Pending Approvals</span>
          <p className="text-2xl font-bold text-amber-400 font-display mt-1">
            {teamLeaves.filter((l) => l.status === 'Pending').length} Pending
          </p>
          <span className="text-[11px] text-amber-300/70 mt-1 block">
            Requires Manager / HR review
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'my-leaves', label: 'My Applications' },
          ...(isHRorAdmin ? [{ id: 'team-leaves', label: 'Team Approval Queue', count: teamLeaves.filter(t => t.status === 'Pending').length }] : []),
          { id: 'holidays', label: 'Corporate Holidays 2026' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* My Leaves Tab */}
      {activeTab === 'my-leaves' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Applied On</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4">Target Approver</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {myLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No leave requests applied yet.
                    </td>
                  </tr>
                ) : (
                  myLeaves.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.leave_type || 'Casual Leave'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-indigo-400">
                          {item.start_date || item.startdate}
                        </span>{' '}
                        to{' '}
                        <span className="font-mono text-indigo-400">
                          {item.end_date || item.enddate}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.applied_on || item.appliedOn || 'Recent'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                        {item.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.approver_name || item.target_role || 'HR Admin'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            item.status === 'Approved'
                              ? 'success'
                              : item.status === 'Rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Approval Queue Tab (for HR/Super Admin) */}
      {activeTab === 'team-leaves' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {teamLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No team leave applications in queue.
                    </td>
                  </tr>
                ) : (
                  teamLeaves.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">
                        {item.employee_name || item.userid}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-300">
                        {item.leave_type || 'Leave'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {item.start_date} → {item.end_date}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-300">
                        {item.reason}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            item.status === 'Approved'
                              ? 'success'
                              : item.status === 'Rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={() => handleReviewAction(item.id, 'Approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={XCircle}
                              onClick={() => {
                                setSelectedLeaveId(item.id);
                                setRejectModalOpen(true);
                              }}
                            >
                              Disallow
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Reviewed by {item.approver_name || 'HR'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Corporate Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Gazetted & Mandatory Holidays 2026
              </h3>
              <p className="text-xs text-slate-400">
                Official holiday schedule compliant with the Factories Act & State Guidelines.
              </p>
            </div>
            <Badge variant="info">
              Indian Standard Calendar
            </Badge>
          </div>

          <div className="divide-y divide-slate-800/60">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex flex-col items-center justify-center font-bold text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-normal">
                      {h.holiday_date?.slice(5, 7) === '10' ? 'OCT' : h.holiday_date?.slice(5, 7) === '11' ? 'NOV' : 'DEC'}
                    </span>
                    <span>{h.holiday_date?.slice(8, 10)}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {h.holiday_name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {h.holiday_date} • {h.holiday_type}
                    </p>
                  </div>
                </div>

                <Badge variant={h.office_status === 'Closed' ? 'danger' : 'success'}>
                  Office {h.office_status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Leave Application"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Leave Classification *
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full h-10"
            >
              <option value="Casual Leave">Casual Leave (Short duration)</option>
              <option value="Sick Leave">Sick Leave (Medical reason)</option>
              <option value="Privilege Leave">Privilege / Earned Leave</option>
              <option value="Maternity / Paternity">Maternity / Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Reason for Leave *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for manager review..."
              className="w-full text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <span>Approval Chain: </span>
            <strong className="text-indigo-400">
              {currentUser.type && currentUser.type.toLowerCase().includes('admin')
                ? 'Super Admin Review'
                : 'HR Admin & Reporting Head'}
            </strong>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              icon={Send}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rejection Remark Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Disallow / Reject Leave Application"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Mandatory HR Governance: A formal rejection remark must be entered to explain why this time-off request cannot be sanctioned.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rejection Reason / Remark *
            </label>
            <textarea
              rows={3}
              value={rejectionRemark}
              onChange={(e) => setRejectionRemark(e.target.value)}
              placeholder="e.g. Critical release sprint scheduled during requested dates..."
              className="w-full text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectionRemark.trim()}
              onClick={() => {
                handleReviewAction(selectedLeaveId, 'Rejected', rejectionRemark);
                setRejectModalOpen(false);
                setRejectionRemark('');
              }}
            >
              Confirm Disallow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
