import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Shield,
  UserCheck,
  Sparkles,
  Download,
  FileText,
  CheckCircle2,
  GitBranch,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { FilterBar } from '../../components/ui/FilterBar';
import { EmployeeManageModal } from './EmployeeManageModal';
import { MONTHS, YEARS, getMonthlySalary, getInitialMonthlyRecord } from '../../lib/salaryStore';
import { generatePayslipPDF } from '../../lib/pdfGenerator';

export function EmployeesPage({
  api,
  onSelectEmployee,
  onShowToast,
  onNavigate
}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Give Action Modal state
  const [selectedEmployeeForAction, setSelectedEmployeeForAction] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Salary Payslip Download Modal state
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = useState(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipMonth, setSlipMonth] = useState('September');
  const [slipYear, setSlipYear] = useState('2026');

  // New Employee Form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDept, setNewDept] = useState('Engineering & Technology');
  const [newDesignation, setNewDesignation] = useState('Software Engineer');
  const [newLocation, setNewLocation] = useState('HQ Vashi Infotech Park');
  const [newRoleType, setNewRoleType] = useState('Employee');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAllUsers();
      if (res.data) setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFromDb = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.getAllUsers();
      if (res.data) {
        setEmployees(res.data);
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Directory Refreshed',
            message: `Loaded ${res.data.length} team members.`
          });
        }
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Sync Notice',
          message: 'Failed to refresh team directory.'
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newFirstName || !newEmail) return;

    try {
      await api.createUser({
        first_name: newFirstName,
        last_name: newLastName,
        email: newEmail,
        phone_number: newPhone || '+91 98000 00000',
        department: newDept,
        designation: newDesignation,
        work_location: newLocation,
        type: newRoleType,
        date_of_joining: new Date().toISOString().split('T')[0],
        status: 'Active'
      });

      setIsAddModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPhone('');
      await loadUsers();

      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Employee Onboarded',
          message: `${newFirstName} ${newLastName} added to the enterprise directory.`
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Failed to Add',
          message: err.message
        });
      }
    }
  };

  const handleOpenGiveAction = (emp) => {
    setSelectedEmployeeForAction(emp);
    setIsActionModalOpen(true);
  };

  const handleOpenSlipModal = (emp) => {
    setSelectedEmployeeForSlip(emp);
    setIsSlipModalOpen(true);
  };

  const handleDownloadSalaryPDF = () => {
    if (!selectedEmployeeForSlip) return;
    const rec =
      getMonthlySalary(selectedEmployeeForSlip.userid, slipYear, slipMonth) ||
      getInitialMonthlyRecord(selectedEmployeeForSlip.userid, slipYear, slipMonth);

    const success = generatePayslipPDF({
      employee: selectedEmployeeForSlip,
      salaryRecord: rec,
      month: slipMonth,
      year: slipYear
    });

    if (success) {
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Payslip Downloaded',
          message: `${slipMonth} ${slipYear} payslip PDF generated for ${selectedEmployeeForSlip.first_name} ${selectedEmployeeForSlip.last_name}.`
        });
      }
      setIsSlipModalOpen(false);
    } else {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Unable to generate payslip PDF. Please try again.'
        });
      }
    }
  };

  const handleActionCompleted = async (actionData) => {
    if (actionData.type === 'full_update') {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.userid === actionData.employeeId
            ? {
                ...emp,
                first_name: actionData.first_name,
                last_name: actionData.last_name,
                email: actionData.email,
                phone_number: actionData.phone_number,
                status: actionData.status,
                department: actionData.department,
                designation: actionData.designation,
                type: actionData.type,
                work_location: actionData.work_location,
                date_of_birth: actionData.date_of_birth
              }
            : emp
        )
      );
      try {
        await api.updateUser(actionData.employeeId, {
          first_name: actionData.first_name,
          last_name: actionData.last_name,
          email: actionData.email,
          phone_number: actionData.phone_number,
          status: actionData.status,
          department: actionData.department,
          designation: actionData.designation,
          type: actionData.type,
          work_location: actionData.work_location,
          date_of_birth: actionData.date_of_birth
        });
      } catch (err) {
        console.error('Error updating employee record:', err);
      }
    } else if (actionData.type === 'role_update') {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.userid === actionData.employeeId
            ? {
                ...emp,
                status: actionData.status,
                department: actionData.department,
                designation: actionData.designation,
                type: actionData.roleType
              }
            : emp
        )
      );
      try {
        await api.updateUser(actionData.employeeId, {
          status: actionData.status,
          department: actionData.department,
          designation: actionData.designation,
          type: actionData.roleType
        });
      } catch (err) {
        console.error('Error updating employee record:', err);
      }
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (emp.userid && emp.userid.toLowerCase().includes(search.toLowerCase())) ||
      (emp.designation && emp.designation.toLowerCase().includes(search.toLowerCase())) ||
      (emp.email && emp.email.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = ['All', 'Engineering & Technology', 'Human Resources', 'Product & Design', 'Executive Leadership'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees Directory"
        subtitle={`Managing ${employees.length} active enterprise members across all locations and departments.`}
        breadcrumbs={['HRMS', 'Directory']}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              className={isRefreshing ? '[&_svg]:animate-spin text-[#4F46E5]' : ''}
              disabled={isRefreshing}
              onClick={handleRefreshFromDb}
              title="Refresh employee directory"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={GitBranch}
              onClick={() => {
                if (onNavigate) {
                  onNavigate('hierarchy');
                }
              }}
            >
              Org Hierarchy Matrix
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              Onboard Employee
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by name, TYS-ID, role, or email..."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="filter-bar__select text-xs"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          <select
            className="filter-bar__select text-xs"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="OnLeave">On Leave</option>
            <option value="Probation">Probation</option>
          </select>
        </div>
      </FilterBar>

      {/* Directory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[#5F6368] font-semibold border-b border-[#E5E7EB] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">ID & Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Role / Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6] text-[#27292C]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5F6368]">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.userid}
                    className="hover:bg-[#F9FAFB] transition-colors group cursor-pointer"
                    onClick={() => onSelectEmployee(emp.userid)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${emp.first_name} ${emp.last_name}`}
                          src={emp.profile_pic_url}
                          size="md"
                          avatarId={emp.avatar_id}
                        />
                        <div>
                          <p className="font-semibold text-[#27292C] group-hover:underline transition-colors">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[11px] text-[#5F6368]">
                            {emp.designation}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-mono text-[#27292C] font-semibold">
                        {emp.userid}
                      </p>
                      <p className="text-[11px] text-[#5F6368]">{emp.department}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-[#27292C]">{emp.email}</p>
                      <p className="text-[11px] text-[#5F6368]">{emp.phone_number}</p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#27292C]">
                        <MapPin className="w-3.5 h-3.5 text-[#5F6368] shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {emp.work_location || 'HQ Vashi'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-[#27292C]">{emp.type || 'Employee'}</span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          emp.status === 'Active'
                            ? 'success'
                            : emp.status === 'OnLeave'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {emp.status || 'Active'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          id={`btn-payslip-${emp.userid}`}
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2 py-1.5 whitespace-nowrap text-[#27292C] hover:bg-[#F3F4F6]"
                          icon={Download}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSlipModal(emp);
                          }}
                        >
                          Payslip PDF
                        </Button>
                        <Button
                          id={`btn-manage-employee-${emp.userid}`}
                          variant="primary"
                          size="sm"
                          className="bg-[#27292C] hover:bg-[#111827] text-[#FFFFFF] font-medium text-xs px-2.5 py-1.5 shadow-xs whitespace-nowrap"
                          icon={Calendar}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGiveAction(emp);
                          }}
                        >
                          Quick Manage
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={ExternalLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee(emp.userid);
                          }}
                        >
                          Dossier
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated Org Hierarchy Matrix Tab Banner */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 border border-[#E0E7FF]">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E293B]">
              Enterprise Organizational Hierarchy & Reporting Matrix
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Dedicated hierarchy database table with Seniors (max 6) & Juniors (max 6), comma-separated user IDs (e.g. A under B and C), right-hand draggable person cards, and 5-stage progression.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={GitBranch}
          onClick={() => onNavigate && onNavigate('hierarchy')}
          className="shrink-0"
        >
          Open Hierarchy Matrix Tab
        </Button>
      </div>

      {/* Onboard New Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Employee"
        size="lg"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="e.g. Vikram"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="e.g. Shinde"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Official Corporate Email *
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@hrtiva.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98..."
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Department
              </label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full h-10"
              >
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Payroll">Finance & Payroll</option>
                <option value="Sales & Operations">Sales & Operations</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Designation / Job Title
              </label>
              <input
                type="text"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Primary Work Location
              </label>
              <select
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full h-10"
              >
                <option value="HQ Vashi Infotech Park">HQ Vashi Infotech Park, Navi Mumbai</option>
                <option value="Bengaluru Tech Hub">Bengaluru Tech Hub</option>
                <option value="Remote / Home Office">Remote / Home Office</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Access Level & Role
              </label>
              <select
                value={newRoleType}
                onChange={(e) => setNewRoleType(e.target.value)}
                className="w-full h-10"
              >
                <option value="Employee">Employee (Standard Access)</option>
                <option value="Department Manager">Department Manager</option>
                <option value="HR Admin">HR Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Generate ID
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Manage Modal */}
      <EmployeeManageModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedEmployeeForAction(null);
        }}
        employee={selectedEmployeeForAction}
        onActionCompleted={handleActionCompleted}
        onShowToast={onShowToast}
        onSelectEmployee={onSelectEmployee}
      />

      {/* Salary Payslip Download Modal */}
      <Modal
        isOpen={isSlipModalOpen}
        onClose={() => {
          setIsSlipModalOpen(false);
          setSelectedEmployeeForSlip(null);
        }}
        title="Download Salary Payslip (PDF)"
        size="md"
      >
        {selectedEmployeeForSlip && (() => {
          const record =
            getMonthlySalary(selectedEmployeeForSlip.userid, slipYear, slipMonth) ||
            getInitialMonthlyRecord(selectedEmployeeForSlip.userid, slipYear, slipMonth);

          return (
            <div className="space-y-4">
              {/* Employee Summary Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]">
                <Avatar
                  name={`${selectedEmployeeForSlip.first_name} ${selectedEmployeeForSlip.last_name}`}
                  src={selectedEmployeeForSlip.profile_pic_url}
                  size="md"
                  avatarId={selectedEmployeeForSlip.avatar_id}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#27292C] truncate">
                    {selectedEmployeeForSlip.first_name} {selectedEmployeeForSlip.last_name}
                  </h4>
                  <p className="text-xs text-[#5F6368] font-mono">
                    {selectedEmployeeForSlip.userid} • {selectedEmployeeForSlip.designation || 'Staff'}
                  </p>
                  <p className="text-[11px] text-[#5F6368] truncate">
                    Disbursal: {record.bank_name || 'HDFC Bank Ltd'} ({record.bank_account || '•••• •••• 9842'})
                  </p>
                </div>
              </div>

              {/* Month & Year Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#27292C] mb-1">
                    Select Month
                  </label>
                  <select
                    value={slipMonth}
                    onChange={(e) => setSlipMonth(e.target.value)}
                    className="w-full text-xs h-9 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-2.5"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#27292C] mb-1">
                    Select Year
                  </label>
                  <select
                    value={slipYear}
                    onChange={(e) => setSlipYear(e.target.value)}
                    className="w-full text-xs h-9 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-2.5"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Breakdown Summary Card */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-[#F3F4F6] pb-1.5">
                  <span className="text-[#5F6368]">Monthly Gross Earnings (Additions):</span>
                  <span className="font-mono font-bold text-[#10B981]">
                    +₹{(record.monthly_gross || 87000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#F3F4F6] pb-1.5">
                  <span className="text-[#5F6368]">Statutory Deductions (PF, PT, TDS):</span>
                  <span className="font-mono font-bold text-[#EF4444]">
                    -₹{(record.total_deductions || 25000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-sm">
                  <span className="text-[#27292C]">Net Disbursed Take-Home:</span>
                  <span className="font-mono text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded">
                    ₹{(record.monthly_net || 62000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsSlipModalOpen(false);
                    setSelectedEmployeeForSlip(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  id="btn-confirm-download-pdf"
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={handleDownloadSalaryPDF}
                >
                  Download {slipMonth} Payslip (PDF)
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
