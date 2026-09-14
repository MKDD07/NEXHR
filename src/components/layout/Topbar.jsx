import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Clock,
  LogOut,
  ChevronDown,
  User,
  Database
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '../ui/Dropdown';

export function Topbar({
  onToggleSidebar,
  currentUser,
  onSwitchUser,
  allUsers = [],
  onSearch,
  todaysAttendance,
  onQuickPunch,
  onOpenNotifications,
  onLogout,
  unreadCount = 2
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setCurrentTime(now.toLocaleString('en-US', options));
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const isCheckedIn = Boolean(todaysAttendance?.check_in_time);
  const isCheckedOut = Boolean(todaysAttendance?.check_out_time);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__icon-btn md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5 text-[#27292C]" />
        </button>

        <div className="topbar__search">
          <Search className="w-4 h-4 text-[#5F6368]" />
          <input
            type="text"
            placeholder="Search employees, jobs, policies..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="topbar__right">
        {/* Real-time Date / Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs text-[#5F6368]">
          <Clock className="w-3.5 h-3.5 text-[#27292C]" />
          <span className="font-mono text-xs">{currentTime}</span>
        </div>

        {/* Quick Punch Button */}
        <button
          type="button"
          onClick={onQuickPunch}
          className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            isCheckedIn && !isCheckedOut
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] hover:bg-[#D1FAE5]'
              : isCheckedOut
              ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#5F6368]'
              : 'bg-[#27292C] border-[#27292C] text-[#FFFFFF] hover:bg-[#1A1C1E]'
          }`}
          title="Record shift attendance"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCheckedIn && !isCheckedOut ? 'bg-[#059669] animate-pulse' : 'bg-current'
            }`}
          />
          <span>
            {isCheckedIn && !isCheckedOut
              ? `Punched In (${todaysAttendance.check_in_time?.slice(0, 5)})`
              : isCheckedOut
              ? 'Shift Finished'
              : 'Punch In'}
          </span>
        </button>

        <div className="topbar__divider" />

        {/* Notifications */}
        <button
          type="button"
          className="topbar__icon-btn"
          onClick={onOpenNotifications}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && <span className="topbar__notification-dot" />}
        </button>

        {/* User Profile & Persona Switcher */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F3F4F6] cursor-pointer transition-colors">
              <Avatar
                name={`${currentUser?.first_name || 'Admin'} ${currentUser?.last_name || ''}`}
                src={currentUser?.profile_pic_url}
                size="sm"
                avatarId={currentUser?.avatar_id}
              />
              <div className="hidden lg:flex flex-col text-left text-xs leading-tight">
                <span className="font-semibold text-[#27292C]">
                  {currentUser?.first_name} {currentUser?.last_name}
                </span>
                <span className="text-[11px] text-[#5F6368]">
                  {currentUser?.type || 'Admin'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5F6368]" />
            </div>
          }
        >
          <DropdownLabel>Active Profile</DropdownLabel>
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

        {/* Direct Standalone Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#5F6368] hover:text-[#DC2626] hover:border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
          title="Sign out of HRMS"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}
