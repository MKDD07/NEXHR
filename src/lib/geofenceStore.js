// Geofence & Biometric Verification Store
// Supports:
// 1. Group-based geofence policies (e.g. HQ Campus, Tech Park Hub, Regional Hub)
// 2. Separate / Individual person geofence coordinates & allowable radius
// 3. Photo / Camera selfie requirement toggle ("photo if needed or not") per person or group

export const DEFAULT_GEOFENCE_GROUPS = [
  {
    group_id: 'group-hq',
    name: 'HQ Vashi Infotech Park Campus',
    type: 'Primary Corporate HQ',
    latitude: 19.0657,
    longitude: 72.9984,
    radius_meters: 250,
    photo_required: true,
    address: 'Sector 30A, Vashi, Navi Mumbai, Maharashtra 400703',
    assigned_departments: ['Engineering & Technology', 'Product & Design', 'Human Resources', 'Finance & Payroll']
  },
  {
    group_id: 'group-blr',
    name: 'Bengaluru R&D Technology Center',
    type: 'Regional Tech Center',
    latitude: 12.9716,
    longitude: 77.5946,
    radius_meters: 300,
    photo_required: true,
    address: 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
    assigned_departments: ['Cloud Infrastructure', 'Security & Compliance']
  },
  {
    group_id: 'group-del',
    name: 'Delhi NCR Business & Client Hub',
    type: 'Sales & Client Hub',
    latitude: 28.6139,
    longitude: 77.2090,
    radius_meters: 200,
    photo_required: false,
    address: 'Barakhamba Road, Connaught Place, New Delhi 110001',
    assigned_departments: ['Sales & Operations']
  },
  {
    group_id: 'group-remote',
    name: 'Remote / Field Flexible Work',
    type: 'Unrestricted Location',
    latitude: 0,
    longitude: 0,
    radius_meters: 0,
    photo_required: false,
    is_unrestricted: true,
    address: 'Global Work-From-Anywhere Approved',
    assigned_departments: ['Field Consultants', 'Executive Board']
  }
];

export function getGeofenceGroups() {
  try {
    const raw = localStorage.getItem('pulse_geofence_groups');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  try {
    localStorage.setItem('pulse_geofence_groups', JSON.stringify(DEFAULT_GEOFENCE_GROUPS));
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_GEOFENCE_GROUPS;
}

export function saveGeofenceGroup(group) {
  const list = getGeofenceGroups();
  const idx = list.findIndex((g) => g.group_id === group.group_id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...group };
  } else {
    list.push(group);
  }
  try {
    localStorage.setItem('pulse_geofence_groups', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
  return list;
}

export function deleteGeofenceGroup(group_id) {
  const list = getGeofenceGroups().filter((g) => g.group_id !== group_id);
  try {
    localStorage.setItem('pulse_geofence_groups', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
  return list;
}

// -------------------------------------------------------------
// INDIVIDUAL PERSON GEOFENCE SETTINGS
// -------------------------------------------------------------

export function getAllEmployeeGeofenceSettings() {
  try {
    const raw = localStorage.getItem('pulse_employee_geofences');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {};
}

export function getEmployeeGeofenceRule(userid, employee = {}) {
  const all = getAllEmployeeGeofenceSettings();
  if (all[userid]) {
    return all[userid];
  }

  // Pre-seed individual rules for demo key employees
  let defaultRule = {
    userid,
    mode: 'group', // 'group' or 'custom'
    group_id: 'group-hq',
    custom_location_name: `${employee.first_name || 'Employee'} Designated Site`,
    custom_latitude: 19.0657,
    custom_longitude: 72.9984,
    custom_radius_meters: 200,
    photo_required: true,
    allow_wfh: false,
    status: 'Enforced'
  };

  if (userid === 'TYS-1021') {
    defaultRule = {
      userid: 'TYS-1021',
      mode: 'custom',
      group_id: 'group-hq',
      custom_location_name: 'Lead Architect Custom Zone & BKC Client Office',
      custom_latitude: 19.0688,
      custom_longitude: 72.8700,
      custom_radius_meters: 350,
      photo_required: true, // Photo verification required
      allow_wfh: true,
      status: 'Enforced'
    };
  } else if (userid === 'TYS-1008') {
    defaultRule = {
      userid: 'TYS-1008',
      mode: 'group',
      group_id: 'group-blr',
      custom_location_name: 'Bengaluru Tech Park',
      custom_latitude: 12.9716,
      custom_longitude: 77.5946,
      custom_radius_meters: 300,
      photo_required: false, // Photo not required
      allow_wfh: false,
      status: 'Enforced'
    };
  }

  return defaultRule;
}

export function saveEmployeeGeofenceRule(userid, rule) {
  const all = getAllEmployeeGeofenceSettings();
  all[userid] = {
    ...rule,
    userid,
    updated_at: new Date().toISOString()
  };
  try {
    localStorage.setItem('pulse_employee_geofences', JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }
  return all[userid];
}

// Get effective resolved geofence for punch check-in
export function getResolvedGeofence(userid, employee = {}) {
  const rule = getEmployeeGeofenceRule(userid, employee);
  if (rule.mode === 'custom') {
    return {
      type: 'Individual Custom Geofence',
      name: rule.custom_location_name || 'Designated Individual Site',
      latitude: Number(rule.custom_latitude),
      longitude: Number(rule.custom_longitude),
      radius_meters: Number(rule.custom_radius_meters || 200),
      photo_required: Boolean(rule.photo_required),
      mode: 'custom'
    };
  }

  // Look up group
  const groups = getGeofenceGroups();
  const group = groups.find((g) => g.group_id === rule.group_id) || groups[0];

  return {
    type: `Group Policy (${group.name})`,
    name: group.name,
    latitude: group.latitude,
    longitude: group.longitude,
    radius_meters: group.radius_meters,
    photo_required: Boolean(rule.photo_required !== undefined ? rule.photo_required : group.photo_required),
    mode: 'group',
    is_unrestricted: Boolean(group.is_unrestricted)
  };
}
