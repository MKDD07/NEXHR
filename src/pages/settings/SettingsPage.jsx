import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  MapPin,
  Shield,
  Save,
  Database,
  Building,
  CalendarDays,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Toggle } from '../../components/ui/Toggle';

export function SettingsPage({
  api,
  onShowToast
}) {
  const [shiftIn, setShiftIn] = useState('09:30');
  const [shiftOut, setShiftOut] = useState('18:30');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [halfDayHours, setHalfDayHours] = useState('4.5');
  const [fullDayHours, setFullDayHours] = useState('8.5');

  // Geofence
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [officeLat, setOfficeLat] = useState('19.0657');
  const [officeLng, setOfficeLng] = useState('72.9984');
  const [geofenceRadius, setGeofenceRadius] = useState('200');

  // Compliance
  const [pfRate, setPfRate] = useState('12');
  const [ptRate, setPtRate] = useState('200');
  const [annualLeaves, setAnnualLeaves] = useState('18');
  const [maxCarryForward, setMaxCarryForward] = useState('12');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Shift timings, geofencing coordinates, and compliance parameters updated.'
      });
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Governance"
        subtitle="Configure company shift timings, geofenced campus parameters, and payroll statutory rules."
        breadcrumbs={['HRMS', 'Settings']}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            onClick={handleSaveSettings}
          >
            Save Changes
          </Button>
        }
      />

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Shift Timings */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-display">
              Work Shift & Punctuality Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Shift In Time
              </label>
              <input
                type="time"
                value={shiftIn}
                onChange={(e) => setShiftIn(e.target.value)}
                className="w-full text-xs h-10"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: 09:30 AM</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Shift Out Time
              </label>
              <input
                type="time"
                value={shiftOut}
                onChange={(e) => setShiftOut(e.target.value)}
                className="w-full text-xs h-10"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: 06:30 PM</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Late Grace Period (Minutes)
              </label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                className="w-full text-xs h-10"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Punches past 09:45 AM marked Late
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min. Hours for Full-Day Attendance
              </label>
              <input
                type="number"
                step="0.5"
                value={fullDayHours}
                onChange={(e) => setFullDayHours(e.target.value)}
                className="w-full text-xs h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Min. Hours for Half-Day Attendance
              </label>
              <input
                type="number"
                step="0.5"
                value={halfDayHours}
                onChange={(e) => setHalfDayHours(e.target.value)}
                className="w-full text-xs h-10"
              />
            </div>
          </div>
        </div>

        {/* Geofence Perimeter */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Campus Geofencing & GPS Punch Terminal
                </h3>
                <p className="text-xs text-slate-400">
                  Enforce strict mobile and web coordinate validation during check-in.
                </p>
              </div>
            </div>

            <Toggle
              checked={geofenceEnabled}
              onChange={setGeofenceEnabled}
              label={geofenceEnabled ? 'Enforced' : 'Disabled'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                HQ Center Latitude
              </label>
              <input
                type="text"
                value={officeLat}
                onChange={(e) => setOfficeLat(e.target.value)}
                className="w-full text-xs h-10 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                HQ Center Longitude
              </label>
              <input
                type="text"
                value={officeLng}
                onChange={(e) => setOfficeLng(e.target.value)}
                className="w-full text-xs h-10 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Allowed Radius (Meters)
              </label>
              <input
                type="number"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="w-full text-xs h-10"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400">
            Current Perimeter: <strong className="text-white">HQ Vashi Infotech Park, Navi Mumbai (Radius: {geofenceRadius}m)</strong>
          </div>
        </div>

        {/* Statutory & Quota Defaults */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-display">
              Statutory Payroll & Annual Quotas
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Employee PF Deduction (%)
              </label>
              <input
                type="number"
                value={pfRate}
                onChange={(e) => setPfRate(e.target.value)}
                className="w-full text-xs h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Professional Tax (₹/mo)
              </label>
              <input
                type="number"
                value={ptRate}
                onChange={(e) => setPtRate(e.target.value)}
                className="w-full text-xs h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Annual Leave Quota (Days)
              </label>
              <input
                type="number"
                value={annualLeaves}
                onChange={(e) => setAnnualLeaves(e.target.value)}
                className="w-full text-xs h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Carry-Forward (Days)
              </label>
              <input
                type="number"
                value={maxCarryForward}
                onChange={(e) => setMaxCarryForward(e.target.value)}
                className="w-full text-xs h-10"
              />
            </div>
          </div>
        </div>

        {/* Database & Diagnostics */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Database & Diagnostics</h4>
                <p className="text-xs text-slate-400">
                  Storage Engine: Cloudflare D1 / SQLite Persistent Cache Active
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={handleResetData}
            >
              Reset Mock Data
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md" icon={Save}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
