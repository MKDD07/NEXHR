import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeavePage } from './pages/leave/LeavePage';
import { PayrollPage } from './pages/payroll/PayrollPage';
import { RecruitmentPage } from './pages/recruitment/RecruitmentPage';
import { PerformancePage } from './pages/performance/PerformancePage';
import { AssetsPage } from './pages/assets/AssetsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SalaryStructurePage } from './pages/salary/SalaryStructurePage';
import { GeofenceRulesPage } from './pages/geofence/GeofenceRulesPage';
import { HierarchyMatrixPage } from './pages/hierarchy/HierarchyMatrixPage';
import { hrmsApi } from './lib/api';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [todaysAttendance, setTodaysAttendance] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Toast dispatch helper
  const showToast = useCallback(({ type = 'info', title, message }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize Auth & Users
  useEffect(() => {
    async function init() {
      try {
        const storedUser = hrmsApi.getCurrentUser();
        const token = hrmsApi.getAuthToken();

        if (token && storedUser) {
          setCurrentUser(storedUser);
          // Fetch attendance for stored user
          const today = new Date().toISOString().split('T')[0];
          const attRes = await hrmsApi.getAttendance(storedUser.userid, today);
          if (attRes.data && attRes.data.length > 0) {
            setTodaysAttendance(attRes.data[0]);
          }
        }

        // Fetch directory of live users
        const usersRes = await hrmsApi.getAllUsers();
        if (usersRes.data && usersRes.data.length > 0) {
          setAllUsers(usersRes.data);
          if (!storedUser) {
            // Not logged in yet
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, []);

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setActivePage('dashboard');
    try {
      const today = new Date().toISOString().split('T')[0];
      const attRes = await hrmsApi.getAttendance(user.userid, today);
      if (attRes.data && attRes.data.length > 0) {
        setTodaysAttendance(attRes.data[0]);
      } else {
        setTodaysAttendance(null);
      }
      // Refresh users list
      const usersRes = await hrmsApi.getAllUsers();
      if (usersRes.data) {
        setAllUsers(usersRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    hrmsApi.logout();
    setCurrentUser(null);
    setTodaysAttendance(null);
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out of PulseHRMS.'
    });
  };

  // Switch persona (e.g. Admin to HR Admin)
  const handleSwitchUser = async (user) => {
    setCurrentUser(user);
    hrmsApi.setCurrentUser(user);
    try {
      const today = new Date().toISOString().split('T')[0];
      const attRes = await hrmsApi.getAttendance(user.userid, today);
      if (attRes.data && attRes.data.length > 0) {
        setTodaysAttendance(attRes.data[0]);
      } else {
        setTodaysAttendance(null);
      }
      showToast({
        type: 'info',
        title: 'Persona Switched',
        message: `Now viewing workspace as ${user.first_name} ${user.last_name} (${user.type}).`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePunchAttendance = async ({ action, latitude, longitude, photo_url }) => {
    if (!currentUser) return;
    try {
      const res = await hrmsApi.markAttendance({
        userid: currentUser.userid,
        action,
        latitude: latitude || 19.0657,
        longitude: longitude || 72.9984,
        photo_url
      });

      if (res.data) {
        setTodaysAttendance(res.data);
      }

      showToast({
        type: 'success',
        title: action === 'punch_in' ? 'Shift Punch In Recorded' : 'Shift Punch Out Recorded',
        message:
          action === 'punch_in'
            ? 'Checked in at HQ campus. Attendance logged in live database.'
            : 'Clocked out successfully. Total shift duration calculated.'
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Punch Failed',
        message: err.message
      });
    }
  };

  const handleSelectEmployee = (userid) => {
    setSelectedEmployeeId(userid);
    setActivePage('employee-detail');
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center text-[#5F6368] space-y-3">
        <div className="w-8 h-8 border-2 border-[#27292C] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-[#5F6368]">
          Connecting to Cloudflare Worker & D1 Database...
        </p>
      </div>
    );
  }

  // Not Authenticated: Render Login Page
  if (!currentUser) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} onShowToast={showToast} />
        {/* Toast Alerts on Login */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="p-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-lg text-xs flex items-center justify-between gap-3 text-[#27292C]"
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-[#5F6368] hover:text-[#27292C]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={(page) => {
        setActivePage(page);
        if (page !== 'employee-detail') {
          setSelectedEmployeeId(null);
        }
      }}
      currentUser={currentUser}
      allUsers={allUsers}
      onSwitchUser={handleSwitchUser}
      onSelectEmployee={handleSelectEmployee}
      todaysAttendance={todaysAttendance}
      onPunchAttendance={handlePunchAttendance}
      onLogout={handleLogout}
      toasts={toasts}
      onDismissToast={dismissToast}
    >
      {activePage === 'dashboard' && (
        <DashboardPage
          currentUser={currentUser}
          onNavigate={(page) => {
            setActivePage(page);
            if (page !== 'employee-detail') setSelectedEmployeeId(null);
          }}
          api={hrmsApi}
          onShowToast={showToast}
        />
      )}

      {activePage === 'employees' && (
        <EmployeesPage
          api={hrmsApi}
          onSelectEmployee={handleSelectEmployee}
          onShowToast={showToast}
          onNavigate={(page) => setActivePage(page)}
        />
      )}

      {activePage === 'hierarchy' && (
        <HierarchyMatrixPage
          api={hrmsApi}
          onSelectEmployee={handleSelectEmployee}
          onShowToast={showToast}
        />
      )}

      {activePage === 'employee-detail' && selectedEmployeeId && (
        <EmployeeDetailPage
          userid={selectedEmployeeId}
          api={hrmsApi}
          onBack={() => setActivePage('employees')}
          onShowToast={showToast}
        />
      )}

      {activePage === 'attendance' && (
        <AttendancePage
          currentUser={currentUser}
          api={hrmsApi}
          todaysAttendance={todaysAttendance}
          onPunchAttendance={handlePunchAttendance}
          onShowToast={showToast}
        />
      )}

      {activePage === 'leave' && (
        <LeavePage
          currentUser={currentUser}
          api={hrmsApi}
          onShowToast={showToast}
        />
      )}

      {activePage === 'payroll' && (
        <PayrollPage
          api={hrmsApi}
          currentUser={currentUser}
          onShowToast={showToast}
        />
      )}

      {activePage === 'salary-structure' && (
        <SalaryStructurePage
          api={hrmsApi}
          onShowToast={showToast}
          onSelectEmployee={handleSelectEmployee}
        />
      )}

      {activePage === 'geofence-rules' && (
        <GeofenceRulesPage
          api={hrmsApi}
          onShowToast={showToast}
          onSelectEmployee={handleSelectEmployee}
        />
      )}

      {activePage === 'recruitment' && (
        <RecruitmentPage
          api={hrmsApi}
          onShowToast={showToast}
        />
      )}

      {activePage === 'performance' && (
        <PerformancePage
          api={hrmsApi}
          currentUser={currentUser}
          onShowToast={showToast}
        />
      )}

      {activePage === 'assets' && (
        <AssetsPage
          api={hrmsApi}
          onShowToast={showToast}
        />
      )}

      {activePage === 'documents' && (
        <DocumentsPage
          api={hrmsApi}
          onShowToast={showToast}
        />
      )}

      {activePage === 'reports' && (
        <ReportsPage
          api={hrmsApi}
          onShowToast={showToast}
        />
      )}

      {activePage === 'settings' && (
        <SettingsPage
          api={hrmsApi}
          onShowToast={showToast}
        />
      )}
    </AppLayout>
  );
}
