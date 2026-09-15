import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Building2,
  User,
  Calendar,
  X
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '../ui/Dropdown';
import { NotificationDropdown } from './NotificationDropdown';

export function Topbar({
  onToggleSidebar,
  currentUser,
  onSwitchUser,
  allUsers = [],
  onSearch,
  onSelectEmployee,
  onOpenNotifications,
  onLogout,
  unreadCount = 3,
  tenantName = 'HRTiva Enterprise'
}) {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [greeting, setGreeting] = useState('Good morning');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function updateHeaderTime() {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 12) {
        setGreeting('Good morning');
      } else if (hour < 17) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }

      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      };
      setCurrentDateStr(now.toLocaleDateString('en-US', options));
    }

    updateHeaderTime();
    const interval = setInterval(updateHeaderTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered employees for lookup
  const filteredEmployees = searchQuery.trim()
    ? allUsers.filter((u) => {
        const full = `${u.first_name || ''} ${u.last_name || ''} ${u.department || ''} ${u.userid || ''}`.toLowerCase();
        return full.includes(searchQuery.toLowerCase());
      }).slice(0, 5)
    : [];

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchOpen(Boolean(val.trim()));
    if (onSearch) onSearch(val);
  };

  const handleSelectFoundEmployee = (empId) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (onSelectEmployee) {
      onSelectEmployee(empId);
    }
  };

  return (
    <header id="tenant-admin-header-bar" className="topbar">
      <div className="topbar__left">
        <button
          id="btn-toggle-sidebar"
          type="button"
          className="topbar__icon-btn md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5 text-[#27292C]" />
        </button>

        {/* Tenant Organization Badge */}
        <div id="tenant-brand-badge" className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB]">
          <div className="w-5 h-5 rounded bg-[#27292C] text-[#FFFFFF] flex items-center justify-center font-bold text-[10px] tracking-wider">
            HR
          </div>
          <span className="text-xs font-semibold text-[#27292C] tracking-tight">
            {tenantName}
          </span>
          <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-[#E5E7EB] text-[#5F6368] rounded">
            Tenant Admin
          </span>
        </div>

        {/* Global Search (Employee Lookup) */}
        <div ref={searchRef} className="topbar__search relative">
          <Search className="w-4 h-4 text-[#5F6368]" />
          <input
            id="input-global-employee-search"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            placeholder="Search employee by name, ID, or department..."
            className="w-full text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Employee Lookup Dropdown */}
          {searchOpen && (
            <div id="search-lookup-dropdown" className="absolute left-0 top-full mt-1 w-72 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1.5 overflow-hidden">
              <div className="px-3 py-1 text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider border-b border-[#F3F4F6]">
                Employee Lookup Results ({filteredEmployees.length})
              </div>
              {filteredEmployees.length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#5F6368] text-center">
                  No employee matching "{searchQuery}"
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <button
                    key={emp.userid}
                    type="button"
                    onClick={() => handleSelectFoundEmployee(emp.userid)}
                    className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] flex items-center gap-2.5 transition-colors cursor-pointer border-b border-[#F9FAFB] last:border-0"
                  >
                    <Avatar
                      name={`${emp.first_name} ${emp.last_name}`}
                      size="sm"
                      avatarId={emp.avatar_id}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#27292C] truncate">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-[11px] text-[#5F6368] truncate">
                        {emp.userid} • {emp.department}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar__right">
        {/* Date & Personalized Greeting: "Good morning, {name}" */}
        <div id="header-date-greeting" className="hidden lg:flex flex-col text-right pr-1">
          <span className="text-xs font-medium text-[#27292C]">
            {greeting}, {currentUser?.first_name || 'Admin'}
          </span>
          <span className="text-[11px] text-[#5F6368] flex items-center justify-end gap-1 font-mono">
            <Calendar className="w-3 h-3 text-[#9CA3AF]" />
            {currentDateStr}
          </span>
        </div>

        <div className="topbar__divider hidden sm:block" />

        {/* Interactive Notification Showcase Dropdown */}
        <NotificationDropdown
          onOpenNotificationsCenter={onOpenNotifications}
        />

        {/* Profile Menu Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div
              id="btn-header-profile-menu"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F3F4F6] cursor-pointer transition-colors"
            >
              <Avatar
                name={`${currentUser?.first_name || 'Admin'} ${currentUser?.last_name || ''}`}
                src={currentUser?.profile_pic_url}
                size="sm"
                avatarId={currentUser?.avatar_id}
              />
              <div className="hidden xl:flex flex-col text-left text-xs leading-tight">
                <span className="font-semibold text-[#27292C]">
                  {currentUser?.first_name} {currentUser?.last_name}
                </span>
                <span className="text-[11px] text-[#5F6368]">
                  {currentUser?.type || 'Tenant Admin'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5F6368]" />
            </div>
          }
        >
          <DropdownLabel>Tenant Profile</DropdownLabel>
          <div className="px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg mx-1 mb-2 text-xs">
            <p className="font-semibold text-[#27292C]">
              {currentUser?.first_name} {currentUser?.last_name}
            </p>
            <p className="text-[11px] text-[#5F6368] font-mono">{currentUser?.email}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5E7EB] text-[#27292C] font-medium">
                {currentUser?.type}
              </span>
              <span className="text-[10px] font-mono text-[#5F6368]">
                {currentUser?.userid}
              </span>
            </div>
          </div>

          {allUsers.length > 1 && (
            <>
              <DropdownLabel>Switch Persona</DropdownLabel>
              {allUsers.map((u) => (
                <DropdownItem
                  key={u.userid}
                  onClick={() => onSwitchUser && onSwitchUser(u)}
                  className={currentUser?.userid === u.userid ? 'bg-[#F3F4F6] font-semibold' : ''}
                >
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="text-[#27292C]">
                      {u.first_name} {u.last_name}
                    </span>
                    <span className="text-[10px] text-[#5F6368]">
                      {u.type}
                    </span>
                  </div>
                </DropdownItem>
              ))}
              <DropdownDivider />
            </>
          )}

          <DropdownItem
            onClick={onLogout}
            className="text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626] font-medium"
          >
            <LogOut className="w-4 h-4 text-[#DC2626]" />
            <span>Log Out</span>
          </DropdownItem>
        </Dropdown>

        {/* Standalone Direct Logout */}
        <button
          id="btn-header-direct-logout"
          type="button"
          onClick={onLogout}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#5F6368] hover:text-[#DC2626] hover:border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
          title="Sign out of HRMS"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
