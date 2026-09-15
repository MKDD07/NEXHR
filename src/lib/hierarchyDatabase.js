// Enterprise Hierarchy Matrix Database Store
// Strictly maps relationships by `user_id`.
// Supports multi-senior (up to 6) and multi-junior (up to 6) relationships,
// formatted with comma-separated user_ids (e.g., A under B and C -> senior_ids: "TYS-1008, TYS-1021").
// Automatically recomputes stages (1 to 5) so it's easy to see who reports under whom.

const STORAGE_KEY = 'pulse_hierarchy_matrix_db_v2';
const SNAPSHOT_KEY = 'pulse_hierarchy_saved_snapshot_v2';
const LAST_SAVED_KEY = 'pulse_hierarchy_last_saved_time';
export const MAX_RELATIONS = 6;
export const MAX_STAGES = 5;

export const STAGE_CONFIG = {
  1: { name: 'Executive / C-Suite', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  2: { name: 'Director / VP', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  3: { name: 'Lead / Manager', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  4: { name: 'Senior Specialist', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  5: { name: 'Associate / Staff', badge: 'bg-slate-50 text-slate-700 border-slate-200' }
};

// Initial verified corporate database records
export const INITIAL_HIERARCHY_DB = {
  'TYS-1021': {
    user_id: 'TYS-1021',
    name: 'Mohit Kataria',
    job_title: 'Chief Technology Officer & Principal Architect',
    department: 'Engineering & Technology',
    profile_pic_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    avatar_id: 2,
    stage: 1,
    senior_ids: [], // Top Executive (0 seniors)
    junior_ids: ['TYS-1008', 'TYS-1003', 'TYS-1005'],
    custom_notes: 'C-Suite Executive Committee'
  },
  'TYS-1008': {
    user_id: 'TYS-1008',
    name: 'Rajesh Sharma',
    job_title: 'VP of Engineering & Cloud Infrastructure',
    department: 'Engineering & Technology',
    profile_pic_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    avatar_id: 3,
    stage: 2,
    senior_ids: ['TYS-1021'], // Reports to Mohit
    junior_ids: ['TYS-1005'], // Manages Ananya
    custom_notes: 'Cloud & Platforms'
  },
  'TYS-1003': {
    user_id: 'TYS-1003',
    name: 'Priyanka Chopra',
    job_title: 'Head of People Operations & HR Director',
    department: 'Human Resources',
    profile_pic_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    avatar_id: 4,
    stage: 2,
    senior_ids: ['TYS-1021'], // Reports to Mohit
    junior_ids: [],
    custom_notes: 'Talent & People Governance'
  },
  'TYS-1005': {
    user_id: 'TYS-1005',
    name: 'Ananya Deshmukh',
    job_title: 'Lead Full Stack & Mobile Engineer',
    department: 'Engineering & Technology',
    profile_pic_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    avatar_id: 1,
    stage: 3,
    // Demonstrates A under B and C: Ananya reports to both Rajesh and Mohit!
    senior_ids: ['TYS-1008', 'TYS-1021'],
    junior_ids: [],
    custom_notes: 'Matrixed reporting structure'
  }
};

// Calculate stage (1 to 5) dynamically based on seniors' stages
export function recalculateStages(db) {
  const visited = new Set();

  const getStage = (userId, path = new Set()) => {
    if (path.has(userId)) return 1; // loop safeguard
    const rec = db[userId];
    if (!rec || !rec.senior_ids || rec.senior_ids.length === 0) {
      return 1;
    }

    path.add(userId);
    let maxSeniorStage = 1;
    for (const sId of rec.senior_ids) {
      if (db[sId]) {
        const sStage = getStage(sId, new Set(path));
        if (sStage > maxSeniorStage) maxSeniorStage = sStage;
      }
    }
    path.delete(userId);

    return Math.min(MAX_STAGES, maxSeniorStage + 1);
  };

  const updated = { ...db };
  Object.keys(updated).forEach((uid) => {
    updated[uid].stage = getStage(uid);
  });

  return updated;
}

// Load database from localStorage, syncing with any updated employee details
export function getHierarchyDatabase(employees = []) {
  let db = {};
  let isExisting = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      db = JSON.parse(raw);
      isExisting = true;
    }
  } catch (e) {
    console.error('Error loading hierarchy matrix db:', e);
  }

  // If empty or never stored, initialize with default initial chart
  if (!isExisting || !db || Object.keys(db).length === 0) {
    db = JSON.parse(JSON.stringify(INITIAL_HIERARCHY_DB));
  }

  // Update existing mapped employees with latest profile info without forcibly adding unplaced ones
  employees.forEach((emp) => {
    const uid = emp.userid || emp.user_id;
    if (!uid) return;

    if (db[uid]) {
      const freshName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      if (freshName) db[uid].name = freshName;
      if (emp.designation && !db[uid].job_title) db[uid].job_title = emp.designation;
      if (emp.department) db[uid].department = emp.department;
      if (emp.profile_pic_url) db[uid].profile_pic_url = emp.profile_pic_url;
      if (emp.avatar_id) db[uid].avatar_id = emp.avatar_id;
    }
  });

  // Re-calculate stages
  db = recalculateStages(db);
  saveHierarchyDatabase(db);
  return db;
}

// Save hierarchy state persistently
export function saveHierarchyDatabase(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving hierarchy store:', e);
  }
}

// User-initiated explicit Save: commits a permanent snapshot and syncs to backend API
export async function saveHierarchy(db) {
  try {
    const serialized = JSON.stringify(db);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(SNAPSHOT_KEY, serialized);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    localStorage.setItem(LAST_SAVED_KEY, nowStr);

    // Also persist to fullstack backend storage
    try {
      await fetch('/api/hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db, savedTime: nowStr, timestamp: new Date().toISOString() })
      });
    } catch (serverErr) {
      console.warn('Backend server hierarchy sync notice:', serverErr);
    }

    return { success: true, timestamp: nowStr };
  } catch (e) {
    console.error('Error saving hierarchy snapshot:', e);
    return { success: false, error: e.message };
  }
}

// User-initiated explicit Load: restores from committed snapshot or backend store
export async function loadSavedHierarchy(employees = []) {
  try {
    // Attempt to load from server endpoint first for cross-device consistency
    try {
      const res = await fetch('/api/hierarchy');
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.db) {
          let serverDb = json.data.db;
          serverDb = recalculateStages(serverDb);
          const savedTime = json.data.savedTime || localStorage.getItem(LAST_SAVED_KEY) || null;
          // Sync to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverDb));
          localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(serverDb));
          return { db: serverDb, savedTime };
        }
      }
    } catch (err) {
      // fallback to local
    }

    const raw = localStorage.getItem(SNAPSHOT_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return { db: getHierarchyDatabase(employees), savedTime: null };
    let db = JSON.parse(raw);
    db = recalculateStages(db);
    const savedTime = localStorage.getItem(LAST_SAVED_KEY) || null;
    return { db, savedTime };
  } catch (e) {
    console.error('Error loading saved hierarchy:', e);
    return { db: getHierarchyDatabase(employees), savedTime: null };
  }
}

export function getLastSavedTime() {
  try {
    return localStorage.getItem(LAST_SAVED_KEY) || null;
  } catch {
    return null;
  }
}

// Add senior to user (bi-directional sync, max 6 seniors and juniors)
export function addSeniorToUser(targetUserId, seniorUserId) {
  const db = getHierarchyDatabase();

  if (targetUserId === seniorUserId) {
    return { success: false, reason: 'An employee cannot report to themselves.' };
  }

  const target = db[targetUserId];
  const senior = db[seniorUserId];

  if (!target || !senior) {
    return { success: false, reason: 'Employee record not found.' };
  }

  if (target.senior_ids.includes(seniorUserId)) {
    return { success: false, reason: `${senior.name} is already listed as a Senior for ${target.name}.` };
  }

  if (target.senior_ids.length >= MAX_RELATIONS) {
    return {
      success: false,
      reason: `Maximum limit of ${MAX_RELATIONS} Seniors reached for ${target.name}.`
    };
  }

  if (senior.junior_ids.length >= MAX_RELATIONS) {
    return {
      success: false,
      reason: `Maximum limit of ${MAX_RELATIONS} Juniors reached for ${senior.name}.`
    };
  }

  // Cycle check: is target already an ancestor of senior?
  const isAncestor = (ancestorId, currentId, visited = new Set()) => {
    if (visited.has(currentId)) return false;
    visited.add(currentId);
    const item = db[currentId];
    if (!item) return false;
    if (item.senior_ids.includes(ancestorId)) return true;
    return item.senior_ids.some((s) => isAncestor(ancestorId, s, visited));
  };

  if (isAncestor(targetUserId, seniorUserId)) {
    return {
      success: false,
      reason: `Loop detected: ${target.name} is already an established Senior above ${senior.name}.`
    };
  }

  // Add senior to target
  target.senior_ids.push(seniorUserId);

  // Add target to senior's juniors
  if (!senior.junior_ids.includes(targetUserId)) {
    senior.junior_ids.push(targetUserId);
  }

  const updated = recalculateStages(db);
  saveHierarchyDatabase(updated);
  return { success: true, db: updated };
}

// Add junior to user (bi-directional sync)
export function addJuniorToUser(targetUserId, juniorUserId) {
  // Adding juniorUserId to targetUserId is equivalent to adding targetUserId as senior to juniorUserId
  return addSeniorToUser(juniorUserId, targetUserId);
}

// Remove senior
export function removeSeniorFromUser(targetUserId, seniorUserId) {
  const db = getHierarchyDatabase();
  if (db[targetUserId]) {
    db[targetUserId].senior_ids = db[targetUserId].senior_ids.filter((id) => id !== seniorUserId);
  }
  if (db[seniorUserId]) {
    db[seniorUserId].junior_ids = db[seniorUserId].junior_ids.filter((id) => id !== targetUserId);
  }
  const updated = recalculateStages(db);
  saveHierarchyDatabase(updated);
  return updated;
}

// Remove junior
export function removeJuniorFromUser(targetUserId, juniorUserId) {
  return removeSeniorFromUser(juniorUserId, targetUserId);
}

// Update Job Title
export function updateEmployeeJobTitle(userId, jobTitle) {
  const db = getHierarchyDatabase();
  if (db[userId]) {
    db[userId].job_title = jobTitle;
    saveHierarchyDatabase(db);
  }
  return db;
}

// Remove person entirely from hierarchy (removes node & severs all relations)
export function removePersonFromHierarchy(userId) {
  const db = getHierarchyDatabase();
  if (!db[userId]) return db;

  delete db[userId];

  // Clean up any references in other people's senior_ids or junior_ids
  Object.keys(db).forEach((key) => {
    db[key].senior_ids = (db[key].senior_ids || []).filter((id) => id !== userId);
    db[key].junior_ids = (db[key].junior_ids || []).filter((id) => id !== userId);
  });

  const updated = recalculateStages(db);
  saveHierarchyDatabase(updated);
  return updated;
}

// Add person to hierarchy from unassigned roster
export function addPersonToHierarchy(emp) {
  const db = getHierarchyDatabase();
  const uid = emp.userid || emp.user_id;
  if (!uid) return db;

  db[uid] = {
    user_id: uid,
    name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || uid,
    job_title: emp.job_title || emp.designation || 'Staff Member',
    department: emp.department || 'Corporate',
    profile_pic_url: emp.profile_pic_url || emp.photo_url || emp.avatar_url || '',
    avatar_id: emp.avatar_id || 0,
    stage: 1,
    senior_ids: [],
    junior_ids: [],
    custom_notes: ''
  };

  const updated = recalculateStages(db);
  saveHierarchyDatabase(updated);
  return updated;
}

// Reset to default
export function resetHierarchyDatabase() {
  const db = JSON.parse(JSON.stringify(INITIAL_HIERARCHY_DB));
  const updated = recalculateStages(db);
  saveHierarchyDatabase(updated);
  return updated;
}
