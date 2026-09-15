import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  X,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { R2_PROFILE_IMAGES } from '../../lib/api';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  approveNotificationAction
} from '../../lib/realtimeNotifications';

export function NotificationDropdown({
  onOpenNotificationsCenter,
  onShowToast
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const containerRef = useRef(null);

  // Subscribe to real-time notifications via WebSocket
  useEffect(() => {
    const unsubscribe = subscribeNotifications((data, connected) => {
      setNotifications(data);
      setIsLiveConnected(connected);
    });
    return unsubscribe;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead();
    if (onShowToast) {
      onShowToast({
        type: 'info',
        title: 'Notifications Cleared',
        message: 'All notifications marked as read across all live sessions.'
      });
    }
  };

  const handleMarkItemRead = (id) => {
    markNotificationRead(id);
  };

  const handleApproveAction = (id) => {
    approveNotificationAction(id);
    const item = notifications.find((n) => n.id === id);
    if (onShowToast && item) {
      onShowToast({
        type: 'success',
        title: 'Approved in Real Time',
        message: `${item.title} for ${item.user?.name || 'employee'} approved and broadcasted.`
      });
    }
  };

  const categories = ['All', 'Approvals', 'Payroll', 'Personnel', 'System'];

  const filteredNotifications =
    activeCategory === 'All'
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Bell Trigger Button */}
      <button
        id="btn-header-notifications-dropdown"
        type="button"
        className="topbar__icon-btn relative cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle notifications dropdown"
        title="Showcase Notifications"
      >
        <Bell className="w-4 h-4 text-[#27292C]" />
        {unreadCount > 0 && (
          <span
            id="badge-unread-notifications"
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#EF4444] text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-[#FFFFFF]"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Showcase Dropdown Menu */}
      {isOpen && (
        <div
          id="notification-dropdown-showcase-panel"
          className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-24px)] bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#27292C]">Notifications</h3>
              {unreadCount > 0 ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">
                  All read
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="px-3 py-2 border-b border-[#F3F4F6] bg-[#FFFFFF] flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? notifications.length
                  : notifications.filter((n) => n.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#27292C] text-[#FFFFFF]'
                      : 'bg-[#F3F4F6] text-[#5F6368] hover:bg-[#E5E7EB] hover:text-[#27292C]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F3F4F6]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF]">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#27292C]">No notifications</p>
                <p className="text-[11px] text-[#5F6368] mt-0.5">
                  You're completely up to date in this category.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  id={`notif-item-${item.id}`}
                  className={`p-3.5 hover:bg-[#F9FAFB] transition-colors flex gap-3 relative ${
                    item.unread ? 'bg-[#F0FDF4]/30' : 'bg-[#FFFFFF]'
                  }`}
                >
                  {/* Left Avatar / Icon */}
                  <div className="shrink-0 mt-0.5">
                    {item.user ? (
                      <Avatar
                        name={item.user.name}
                        src={item.user.profile_pic_url}
                        size="md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#27292C]">
                        <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-xs font-bold text-[#27292C] leading-snug">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#4B5563] leading-relaxed mb-2">
                      {item.message}
                    </p>

                    {item.systemTag && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#F3F4F6] text-[#5F6368] mb-1">
                        <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                        {item.systemTag}
                      </span>
                    )}

                    {/* Quick Inline Actions */}
                    {item.category === 'Approvals' && (
                      <div className="flex items-center gap-2 mt-1">
                        {item.approved ? (
                          <span className="text-[11px] font-semibold text-[#10B981] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <>
                            <button
                              id={`btn-notif-approve-${item.id}`}
                              type="button"
                              onClick={() => handleApproveAction(item.id)}
                              className="px-2.5 py-1 rounded-md bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              id={`btn-notif-dismiss-${item.id}`}
                              type="button"
                              onClick={() => handleMarkItemRead(item.id)}
                              className="px-2 py-1 rounded-md bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#5F6368] hover:text-[#27292C] text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Unread indicator dot */}
                  {item.unread && (
                    <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'
                }`}
              />
              <span className="text-[#5F6368] font-medium">
                {isLiveConnected ? 'Live WebSocket Active' : 'Connecting to Live Feed...'}
              </span>
            </div>
            {onOpenNotificationsCenter && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenNotificationsCenter();
                }}
                className="text-[11px] font-semibold text-[#27292C] hover:text-[#000000] flex items-center gap-1 cursor-pointer transition-colors"
              >
                Full Center
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
