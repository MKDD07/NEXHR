import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Camera,
  Shield,
  ShieldCheck,
  Building,
  Plus,
  Edit,
  Save,
  CheckCircle2,
  AlertTriangle,
  Search,
  Users,
  Navigation,
  Crosshair,
  Sliders,
  ExternalLink,
  Layers
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import {
  getGeofenceGroups,
  saveGeofenceGroup,
  getAllEmployeeGeofenceSettings,
  getEmployeeGeofenceRule,
  saveEmployeeGeofenceRule
} from '../../lib/geofenceStore';

export function GeofenceRulesPage({ api, onShowToast, onSelectEmployee }) {
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' or 'groups'
  const [groups, setGroups] = useState(getGeofenceGroups());
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modal for editing an individual employee's geofence & photo rule
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isEditEmpModalOpen, setIsEditEmpModalOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    mode: 'group', // 'group' or 'custom'
    group_id: 'group-hq',
    custom_location_name: '',
    custom_latitude: 19.0657,
    custom_longitude: 72.9984,
    custom_radius_meters: 250,
    photo_required: true,
    allow_wfh: false,
    status: 'Enforced'
  });

  // Modal for adding a new group geofence
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    group_id: '',
    name: '',
    type: 'Regional Office',
    latitude: 19.0760,
    longitude: 72.8777,
    radius_meters: 250,
    photo_required: true,
    address: ''
  });

  // Load employees
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        if (api?.getAllUsers) {
          const res = await api.getAllUsers();
          if (res?.data) {
            setEmployees(res.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [api]);

  // Open Edit Individual Geofence Modal
  const handleOpenEditEmp = (emp) => {
    const currentRule = getEmployeeGeofenceRule(emp.userid, emp);
    setSelectedEmp(emp);
    setEmpForm({
      mode: currentRule.mode || 'group',
      group_id: currentRule.group_id || 'group-hq',
      custom_location_name:
        currentRule.custom_location_name || `${emp.first_name}'s Designated Site`,
      custom_latitude: currentRule.custom_latitude || 19.0657,
      custom_longitude: currentRule.custom_longitude || 72.9984,
      custom_radius_meters: currentRule.custom_radius_meters || 200,
      photo_required:
        currentRule.photo_required !== undefined ? currentRule.photo_required : true,
      allow_wfh: Boolean(currentRule.allow_wfh),
      status: currentRule.status || 'Enforced'
    });
    setIsEditEmpModalOpen(true);
  };

  // Save Individual Geofence
  const handleSaveEmpGeofence = (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    saveEmployeeGeofenceRule(selectedEmp.userid, empForm);
    setIsEditEmpModalOpen(false);

    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Geofence & Photo Rules Updated',
        message: `Custom policy saved for ${selectedEmp.first_name} ${selectedEmp.last_name} (${empForm.mode === 'custom' ? 'Separate Coordinates' : 'Group Policy'}).`
      });
    }
  };

  // Detect current GPS coordinate using browser location API
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEmpForm((prev) => ({
            ...prev,
            custom_latitude: Number(pos.coords.latitude.toFixed(6)),
            custom_longitude: Number(pos.coords.longitude.toFixed(6))
          }));
          if (onShowToast) {
            onShowToast({
              type: 'info',
              title: 'GPS Coordinates Captured',
              message: `Latitude: ${pos.coords.latitude.toFixed(4)}, Longitude: ${pos.coords.longitude.toFixed(4)}`
            });
          }
        },
        (err) => {
          if (onShowToast) {
            onShowToast({
              type: 'warning',
              title: 'GPS Access Denied',
              message: 'Using default campus coordinates.'
            });
          }
        }
      );
    }
  };

  // Save New Group Geofence
  const handleSaveGroup = (e) => {
    e.preventDefault();
    const newGroupId = groupForm.group_id || `group-${Date.now()}`;
    const toSave = {
      ...groupForm,
      group_id: newGroupId,
      latitude: Number(groupForm.latitude),
      longitude: Number(groupForm.longitude),
      radius_meters: Number(groupForm.radius_meters)
    };
    const updated = saveGeofenceGroup(toSave);
    setGroups(updated);
    setIsAddGroupModalOpen(false);
    setGroupForm({
      group_id: '',
      name: '',
      type: 'Regional Office',
      latitude: 19.0760,
      longitude: 72.8777,
      radius_meters: 250,
      photo_required: true,
      address: ''
    });

    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Group Geofence Site Saved',
        message: `Configured campus: ${toSave.name}.`
      });
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      (emp.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.userid || '').toLowerCase().includes(search.toLowerCase());

    const matchDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geofence & Biometric Verification Rules"
        subtitle="Configure individual separate geofence coordinates, allowable radius, and facial photo verification policies per employee or corporate group."
        breadcrumbs={['HRMS', 'Attendance', 'Geofence & Photo Rules']}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'individual' ? 'primary' : 'secondary'}
              size="sm"
              icon={Users}
              onClick={() => setActiveTab('individual')}
            >
              Individual Person Geofence
            </Button>
            <Button
              variant={activeTab === 'groups' ? 'primary' : 'secondary'}
              size="sm"
              icon={Building}
              onClick={() => setActiveTab('groups')}
            >
              Group-Based Campus Geofence
            </Button>
          </div>
        }
      />

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF]">
          <span className="text-[#5F6368] block">Configured Campus Sites</span>
          <span className="text-xl font-bold text-[#27292C] mt-0.5 block">
            {groups.length} Sites
          </span>
          <span className="text-[11px] text-[#10B981] mt-1 block">
            GPS Boundary Enabled
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF]">
          <span className="text-[#5F6368] block">Custom Individual Geofences</span>
          <span className="text-xl font-bold text-[#2563EB] mt-0.5 block">
            Active
          </span>
          <span className="text-[11px] text-[#5F6368] mt-1 block">
            Separate Lat/Lng per person
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF]">
          <span className="text-[#5F6368] block">Photo Punch Verification</span>
          <span className="text-xl font-bold text-[#10B981] mt-0.5 block">
            Camera Enabled
          </span>
          <span className="text-[11px] text-[#5F6368] mt-1 block">
            Configurable per person
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#10B981]/30 bg-[#ECFDF5]">
          <span className="text-[#065F46] block font-semibold">Attendance Integrity</span>
          <span className="text-xl font-bold text-[#065F46] mt-0.5 block">
            100% Verified
          </span>
          <span className="text-[11px] text-[#059669] mt-1 block">
            Zero mock locations allowed
          </span>
        </div>
      </div>

      {/* TAB 1: INDIVIDUAL PERSON GEOFENCE */}
      {activeTab === 'individual' && (
        <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#27292C]">
                Individual Employee Geofence & Camera Photo Requirements
              </h3>
              <p className="text-xs text-[#5F6368]">
                Assign either a group campus policy or separate custom coordinates (Lat, Lng, Radius, and Photo toggle) for every person.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="text"
                placeholder="Filter by employee name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs w-56"
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs h-9"
              >
                <option value="all">All Departments</option>
                <option value="Engineering & Technology">Engineering</option>
                <option value="Product & Design">Product</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Payroll">Finance</option>
                <option value="Sales & Operations">Sales</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F9FAFB] text-[#5F6368] font-bold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department & Role</th>
                  <th className="py-2.5 px-3">Geofence Policy</th>
                  <th className="py-2.5 px-3">Designated Location / Coordinates</th>
                  <th className="py-2.5 px-3">Allowable Radius</th>
                  <th className="py-2.5 px-3">Photo Verification</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredEmployees.map((emp) => {
                  const rule = getEmployeeGeofenceRule(emp.userid, emp);
                  const isCustom = rule.mode === 'custom';
                  const assignedGroup = groups.find((g) => g.group_id === rule.group_id);

                  return (
                    <tr key={emp.userid} className="hover:bg-[#FAFAFA]">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={`${emp.first_name} ${emp.last_name}`}
                            src={emp.profile_pic_url}
                            size="sm"
                            avatarId={emp.avatar_id}
                          />
                          <div>
                            <span className="font-bold text-[#27292C] block">
                              {emp.first_name} {emp.last_name}
                            </span>
                            <span className="font-mono text-[11px] text-[#2563EB]">
                              {emp.userid}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#27292C] block">
                          {emp.department}
                        </span>
                        <span className="text-[11px] text-[#5F6368]">
                          {emp.designation}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <Badge variant={isCustom ? 'info' : 'neutral'}>
                          {isCustom ? 'Separate Individual Geofence' : 'Group Site Policy'}
                        </Badge>
                      </td>

                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-[#27292C]">
                          {isCustom
                            ? rule.custom_location_name
                            : assignedGroup?.name || 'HQ Campus'}
                        </p>
                        <p className="font-mono text-[11px] text-[#5F6368]">
                          {isCustom
                            ? `${rule.custom_latitude}, ${rule.custom_longitude}`
                            : `${assignedGroup?.latitude || 19.0657}, ${assignedGroup?.longitude || 72.9984}`}
                        </p>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-semibold text-[#27292C]">
                        {isCustom ? rule.custom_radius_meters : assignedGroup?.radius_meters || 250}m
                      </td>

                      <td className="py-2.5 px-3">
                        {rule.photo_required ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            <Camera className="w-3 h-3" />
                            Selfie Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] text-[#5F6368]">
                            Not Required
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleOpenEditEmp(emp)}
                        >
                          Configure
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GROUP-BASED CAMPUS SITES */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#27292C]">
                Corporate Campus & Regional Hub Geofences
              </h3>
              <p className="text-xs text-[#5F6368]">
                Standard enterprise locations where attendance punches are verified via group boundary rules.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddGroupModalOpen(true)}
            >
              Add Campus Site
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((grp) => (
              <div
                key={grp.group_id}
                className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F3F4F6] text-[#5F6368] font-bold">
                      {grp.group_id}
                    </span>
                    <h4 className="text-base font-bold text-[#27292C] mt-1">
                      {grp.name}
                    </h4>
                    <p className="text-xs text-[#5F6368]">{grp.address}</p>
                  </div>

                  <Badge variant="info">{grp.type}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F3F4F6] text-xs">
                  <div>
                    <span className="text-[#5F6368] text-[11px] block">Coordinates</span>
                    <span className="font-mono font-semibold text-[#27292C]">
                      {grp.latitude}, {grp.longitude}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#5F6368] text-[11px] block">Allowable Radius</span>
                    <span className="font-mono font-semibold text-[#27292C]">
                      {grp.radius_meters} meters
                    </span>
                  </div>

                  <div>
                    <span className="text-[#5F6368] text-[11px] block">Photo Required</span>
                    <span
                      className={`font-semibold ${
                        grp.photo_required ? 'text-[#10B981]' : 'text-[#5F6368]'
                      }`}
                    >
                      {grp.photo_required ? 'Mandatory Selfie' : 'Optional'}
                    </span>
                  </div>
                </div>

                {grp.assigned_departments && (
                  <div className="pt-2 border-t border-[#F3F4F6]">
                    <span className="text-[11px] text-[#5F6368] block mb-1">
                      Mapped Departments:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {grp.assigned_departments.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#27292C] text-[10px] font-medium"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT INDIVIDUAL EMPLOYEE GEOFENCE & PHOTO */}
      {selectedEmp && (
        <Modal
          isOpen={isEditEmpModalOpen}
          onClose={() => setIsEditEmpModalOpen(false)}
          title={`Geofence & Biometric Settings: ${selectedEmp.first_name} ${selectedEmp.last_name}`}
          size="lg"
        >
          <form onSubmit={handleSaveEmpGeofence} className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#27292C]">
                  {selectedEmp.first_name} {selectedEmp.last_name} ({selectedEmp.userid})
                </span>
                <p className="text-[#5F6368]">
                  {selectedEmp.designation} • {selectedEmp.department}
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E5E7EB]">
                {selectedEmp.work_location || 'HQ Vashi'}
              </span>
            </div>

            {/* Mode: Group vs Individual Separate */}
            <div>
              <label className="block font-semibold text-[#27292C] mb-1.5">
                Geofence Assignment Policy Mode *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between ${
                    empForm.mode === 'group'
                      ? 'border-[#27292C] bg-[#F9FAFB] ring-1 ring-[#27292C]'
                      : 'border-[#E5E7EB] bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gmode"
                      value="group"
                      checked={empForm.mode === 'group'}
                      onChange={() => setEmpForm({ ...empForm, mode: 'group' })}
                    />
                    <span className="font-bold text-[#27292C]">Group-Based Site</span>
                  </div>
                  <span className="text-[11px] text-[#5F6368] mt-1">
                    Inherits coordinates and radius from assigned corporate office site.
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between ${
                    empForm.mode === 'custom'
                      ? 'border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]'
                      : 'border-[#E5E7EB] bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gmode"
                      value="custom"
                      checked={empForm.mode === 'custom'}
                      onChange={() => setEmpForm({ ...empForm, mode: 'custom' })}
                    />
                    <span className="font-bold text-[#1E3A8A]">Separate Individual Geofence</span>
                  </div>
                  <span className="text-[11px] text-[#2563EB] mt-1">
                    Individual latitude, longitude, and custom radius specifically for this person.
                  </span>
                </label>
              </div>
            </div>

            {/* If Group selected */}
            {empForm.mode === 'group' ? (
              <div>
                <label className="block font-semibold text-[#27292C] mb-1">
                  Select Corporate Campus / Site *
                </label>
                <select
                  value={empForm.group_id}
                  onChange={(e) => setEmpForm({ ...empForm, group_id: e.target.value })}
                  className="w-full text-xs h-9"
                >
                  {groups.map((g) => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.name} ({g.radius_meters}m radius • Lat: {g.latitude}, Lng: {g.longitude})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* If Custom Separate Geofence selected */
              <div className="space-y-3 p-3 bg-[#EFF6FF]/60 rounded-xl border border-[#2563EB]/20">
                <div>
                  <label className="block font-semibold text-[#1E3A8A] mb-1">
                    Designated Site / Custom Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={empForm.custom_location_name}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, custom_location_name: e.target.value })
                    }
                    placeholder="e.g. Personal Home Office (Thane) or Client Campus BKC"
                    className="w-full text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1E3A8A] mb-1">
                      Latitude Coordinate *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={empForm.custom_latitude}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, custom_latitude: e.target.value })
                      }
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E3A8A] mb-1">
                      Longitude Coordinate *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={empForm.custom_longitude}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, custom_longitude: e.target.value })
                      }
                      className="w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#2563EB]">
                    Current: ({empForm.custom_latitude}, {empForm.custom_longitude})
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Crosshair}
                    onClick={handleDetectGPS}
                  >
                    Auto-Fill Current GPS
                  </Button>
                </div>

                <div>
                  <label className="block font-semibold text-[#1E3A8A] mb-1">
                    Allowable Geofence Radius (Meters) *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="25"
                      value={empForm.custom_radius_meters}
                      onChange={(e) =>
                        setEmpForm({
                          ...empForm,
                          custom_radius_meters: Number(e.target.value)
                        })
                      }
                      className="flex-1 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-[#1E3A8A] w-20 text-right">
                      {empForm.custom_radius_meters} m
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PHOTO VERIFICATION REQUIREMENT TOGGLE */}
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#27292C] flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#2563EB]" />
                    Photo Verification on Shift Punch (In/Out)
                  </span>
                  <p className="text-[11px] text-[#5F6368]">
                    Require employee to take a real-time selfie picture using device camera when marking attendance.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={empForm.photo_required}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, photo_required: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>

              <div className="text-[11px] font-medium text-[#5F6368]">
                Status:{' '}
                {empForm.photo_required ? (
                  <span className="text-[#10B981] font-bold">
                    MANDATORY — Webcam/Selfie photo required on every punch
                  </span>
                ) : (
                  <span className="text-[#6B7280]">
                    OPTIONAL — Attendance punch verified by GPS only (no camera required)
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditEmpModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" icon={Save} type="submit">
                Save Geofence & Photo Rule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: ADD GROUP GEOFENCE SITE */}
      <Modal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        title="Add Corporate Campus / Regional Hub Geofence"
        size="md"
      >
        <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#27292C] mb-1">
              Campus / Site Name *
            </label>
            <input
              type="text"
              required
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="e.g. Pune Hinjewadi Tech Center"
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#27292C] mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              value={groupForm.address}
              onChange={(e) => setGroupForm({ ...groupForm, address: e.target.value })}
              placeholder="e.g. Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune"
              className="w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#27292C] mb-1">
                Latitude Coordinate *
              </label>
              <input
                type="number"
                step="any"
                required
                value={groupForm.latitude}
                onChange={(e) =>
                  setGroupForm({ ...groupForm, latitude: e.target.value })
                }
                className="w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#27292C] mb-1">
                Longitude Coordinate *
              </label>
              <input
                type="number"
                step="any"
                required
                value={groupForm.longitude}
                onChange={(e) =>
                  setGroupForm({ ...groupForm, longitude: e.target.value })
                }
                className="w-full text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#27292C] mb-1">
                Allowable Radius (Meters)
              </label>
              <input
                type="number"
                value={groupForm.radius_meters}
                onChange={(e) =>
                  setGroupForm({ ...groupForm, radius_meters: e.target.value })
                }
                className="w-full text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#27292C]">
                <input
                  type="checkbox"
                  checked={groupForm.photo_required}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, photo_required: e.target.checked })
                  }
                />
                <span>Mandatory Selfie Photo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddGroupModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={CheckCircle2} type="submit">
              Save Campus Geofence
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
