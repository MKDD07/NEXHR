import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  Briefcase,
  UserPlus,
  UserMinus,
  Target,
  GraduationCap,
  FolderLock,
  Headphones,
  Sliders,
  Sparkles,
  ChevronRight,
  LogOut,
  Database
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { DB_ID } from '../../lib/api';

const NAV_SECTIONS = [
  {
    title: 'Core Administration',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'employees', label: 'Employee Directory', icon: Users, badge: '148' },
      { id: 'attendance', label: 'Attendance & Geofence', icon: Clock },
      { id: 'leave', label: 'Leaves & Holidays', icon: CalendarDays },
      { id: 'payroll', label: 'Payroll & CTC', icon: CreditCard }
    ]
  },
  {
    title: 'Talent & Operations',
    items: [
      { id: 'recruitment', label: 'Recruitment & ATS', icon: Briefcase, badge: '5 Open' },
      { id: 'onboarding', label: 'Onboarding & Checklists', icon: UserPlus },
      { id: 'offboarding', label: 'Offboarding & Exit', icon: UserMinus },
      { id: 'performance', label: 'Goals & OKRs', icon: Target },
      { id: 'learning', label: 'Learning & Development', icon: GraduationCap }
    ]
  },
  {
    title: 'Organization Governance',
    items: [
      { id: 'documents', label: 'Document Vault', icon: FolderLock },
      { id: 'helpdesk', label: 'HR Help Desk', icon: Headphones, badge: '4' },
      { id: 'settings', label: 'Settings & Shifts', icon: Sliders }
    ]
  }
];

export function Sidebar({
  activeTab,
  onNavigate,
  currentUser,
  isOpen,
  onClose,
  onLogout
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar__brand">
          <div className="sidebar__brand-logo">
            <Sparkles className="w-5 h-5 text-[#27292C]" />
          </div>
          <div className="sidebar__brand-text">
            <strong>PulseHRMS</strong>
            <span>Enterprise Admin</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar__nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="sidebar__section">
              <div className="sidebar__section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar__link ${
                      isActive ? 'sidebar__link--active' : ''
                    }`}
                    onClick={() => {
                      onNavigate(item.id);
                      if (onClose) onClose();
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="sidebar__badge">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Active User & Sign Out */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <Avatar
              name={`${currentUser?.first_name || 'Admin'} ${currentUser?.last_name || ''}`}
              src={currentUser?.profile_pic_url}
              size="md"
              status="online"
              avatarId={currentUser?.avatar_id}
            />
            <div className="sidebar__user-info flex-1">
              <strong>
                {currentUser?.first_name} {currentUser?.last_name}
              </strong>
              <span>{currentUser?.type || 'HR Admin'}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded text-[#5F6368] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#5F6368]">
            <span className="font-mono flex items-center gap-1">
              <Database className="w-3 h-3 text-[#27292C]" />
              {DB_ID.slice(0, 8)}
            </span>
            <span className="text-[#10B981] font-medium">Live D1</span>
          </div>
        </div>
      </aside>
    </>
  );
}
