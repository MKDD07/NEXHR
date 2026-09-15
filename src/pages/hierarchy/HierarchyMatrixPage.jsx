import React, { useState, useEffect, useMemo } from 'react';
import {
  GitBranch,
  Users,
  Search,
  Plus,
  Move,
  RotateCcw,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  Shield,
  Layers,
  Table,
  Check,
  CheckCheck,
  X,
  ChevronDown,
  ChevronRight,
  UserPlus,
  ArrowRight,
  Info,
  Sparkles,
  AlertCircle,
  Network,
  Workflow,
  Save
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { OrgFlowchartCanvas } from '../../components/hierarchy/OrgFlowchartCanvas';
import {
  getHierarchyDatabase,
  saveHierarchy,
  loadSavedHierarchy,
  getLastSavedTime,
  addSeniorToUser,
  addJuniorToUser,
  removeSeniorFromUser,
  removeJuniorFromUser,
  updateEmployeeJobTitle,
  resetHierarchyDatabase,
  removePersonFromHierarchy,
  addPersonToHierarchy,
  MAX_RELATIONS,
  MAX_STAGES,
  STAGE_CONFIG
} from '../../lib/hierarchyDatabase';

export function HierarchyMatrixPage({
  api,
  onSelectEmployee,
  onShowToast
}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [db, setDb] = useState({});
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [rightPanelSearch, setRightPanelSearch] = useState('');
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState({});
  const [viewMode, setViewMode] = useState('flowchart'); // 'flowchart' | 'table'

  // Drag-and-drop state
  const [draggedUserId, setDraggedUserId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { userId, role: 'senior' | 'junior' }

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'add-senior' | 'add-junior' | 'edit-title'
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [modalSelectedPersonId, setModalSelectedPersonId] = useState('');
  const [jobTitleInput, setJobTitleInput] = useState('');

  // Explicit sync handler to reload personnel from team directory
  const handleSyncTeam = async (showFeedback = true) => {
    setIsRefreshing(true);
    try {
      const res = await api.getAllUsers();
      if (res && res.data) {
        setEmployees(res.data);
        const freshDb = getHierarchyDatabase(res.data);
        setDb(freshDb);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSynced(timeStr);
        if (showFeedback && onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Team Synchronized',
            message: `Successfully loaded ${res.data.length} team members.`
          });
        }
      }
    } catch (err) {
      console.error('Error syncing team:', err);
      if (showFeedback && onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Sync Notice',
          message: 'Unable to reach live directory. Displaying cached records.'
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Save current hierarchy structure
  const handleSaveHierarchy = async () => {
    setIsSaving(true);
    try {
      const res = await saveHierarchy(db);
      if (res.success) {
        setHasUnsavedChanges(false);
        setLastSaved(res.timestamp);
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Hierarchy Saved',
            message: 'All reporting lines, stages, and organizational structure saved successfully.'
          });
        }
      } else {
        throw new Error(res.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving hierarchy:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Save Failed',
          message: 'Unable to save current hierarchy.'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Load last saved hierarchy structure
  const handleLoadSaved = async () => {
    const { db: loadedDb, savedTime } = await loadSavedHierarchy(employees);
    setDb(loadedDb);
    setHasUnsavedChanges(false);
    if (savedTime) setLastSaved(savedTime);
    if (onShowToast) {
      onShowToast({
        type: 'info',
        title: 'Saved Hierarchy Loaded',
        message: savedTime ? `Restored structure saved at ${savedTime}.` : 'Restored saved organizational chart structure.'
      });
    }
  };

  // Load employees and initialize structure
  useEffect(() => {
    let mounted = true;
    const initData = async () => {
      setLoading(true);
      try {
        const res = await api.getAllUsers();
        if (mounted && res.data) {
          setEmployees(res.data);
          const { db: initialDb, savedTime } = await loadSavedHierarchy(res.data);
          setDb(initialDb);
          if (savedTime) setLastSaved(savedTime);
          const now = new Date();
          setLastSynced(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initData();
    return () => {
      mounted = false;
    };
  }, [api]);

  // Handle Drag Events
  const handleDragStart = (e, userId) => {
    setDraggedUserId(userId);
    e.dataTransfer.setData('text/plain', userId);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOverCell = (e, targetUserId, role) => {
    e.preventDefault();
    if (!draggedUserId || draggedUserId === targetUserId) return;
    setDropTarget({ userId: targetUserId, role });
  };

  const handleDragLeaveCell = (e) => {
    setDropTarget(null);
  };

  const handleDropOnCell = (e, targetUserId, role) => {
    e.preventDefault();
    const sourceUserId = draggedUserId || e.dataTransfer.getData('text/plain');
    setDraggedUserId(null);
    setDropTarget(null);

    if (!sourceUserId || sourceUserId === targetUserId) return;

    // If sourceUserId is not in db (from available roster on right), add them first
    if (!db[sourceUserId]) {
      const emp = employees.find((e) => (e.userid || e.user_id) === sourceUserId);
      if (emp) {
        addPersonToHierarchy(emp);
      }
    }

    if (role === 'senior') {
      // Add sourceUserId as Senior to targetUserId
      const res = addSeniorToUser(targetUserId, sourceUserId);
      if (!res.success) {
        if (onShowToast) {
          onShowToast({
            type: 'error',
            title: 'Senior Assignment Failed',
            message: res.reason
          });
        }
        return;
      }
      setDb({ ...res.db });
      setHasUnsavedChanges(true);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Senior Manager Added',
          message: `${res.db[sourceUserId]?.name || sourceUserId} added as Senior to ${res.db[targetUserId]?.name || targetUserId}. Click 'Save Changes' to keep permanently.`
        });
      }
    } else if (role === 'junior') {
      // Add sourceUserId as Junior to targetUserId
      const res = addJuniorToUser(targetUserId, sourceUserId);
      if (!res.success) {
        if (onShowToast) {
          onShowToast({
            type: 'error',
            title: 'Junior Assignment Failed',
            message: res.reason
          });
        }
        return;
      }
      setDb({ ...res.db });
      setHasUnsavedChanges(true);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Subordinate Added',
          message: `${res.db[sourceUserId]?.name || sourceUserId} added as Junior to ${res.db[targetUserId]?.name || targetUserId}. Click 'Save Changes' to keep permanently.`
        });
      }
    }
  };

  // Remove relationships
  const handleRemoveSenior = (targetUserId, seniorUserId) => {
    const updated = removeSeniorFromUser(targetUserId, seniorUserId);
    setDb({ ...updated });
    setHasUnsavedChanges(true);
    if (onShowToast) {
      onShowToast({
        type: 'info',
        title: 'Senior Removed',
        message: `Removed ${seniorUserId} from Seniors list.`
      });
    }
  };

  const handleRemoveJunior = (targetUserId, juniorUserId) => {
    const updated = removeJuniorFromUser(targetUserId, juniorUserId);
    setDb({ ...updated });
    setHasUnsavedChanges(true);
    if (onShowToast) {
      onShowToast({
        type: 'info',
        title: 'Junior Removed',
        message: `Removed ${juniorUserId} from Juniors list.`
      });
    }
  };

  // Remove person entirely from flow chart & matrix
  const handleRemovePerson = (userId) => {
    const person = db[userId];
    const name = person?.name || userId;
    if (
      window.confirm(
        `Remove ${name} (${userId}) from the flow chart?\n\nThey will be unlinked and moved to the available roster on the right.`
      )
    ) {
      const updated = removePersonFromHierarchy(userId);
      setDb({ ...updated });
      setHasUnsavedChanges(true);
      if (onShowToast) {
        onShowToast({
          type: 'info',
          title: 'Person Removed from Chart',
          message: `${name} has been removed from the flowchart and moved to the available roster.`
        });
      }
    }
  };

  // Add person from available roster into flowchart
  const handleAddPersonFromRoster = (userId) => {
    const emp = employees.find((e) => (e.userid || e.user_id) === userId);
    if (!emp) return;
    const updated = addPersonToHierarchy(emp);
    setDb({ ...updated });
    setHasUnsavedChanges(true);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Employee Added to Flow Chart',
        message: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() + ` (${userId}) is now placed on the flowchart.`
      });
    }
  };

  // Reset hierarchy to default
  const handleResetHierarchy = () => {
    if (
      window.confirm(
        'Reset organizational chart to corporate default (Mohit Kataria as CTO, Rajesh Sharma as VP, Priyanka Chopra as HR, Ananya Deshmukh as Lead Engineer)?'
      )
    ) {
      const def = resetHierarchyDatabase();
      setDb(def);
      setHasUnsavedChanges(false);
      const res = saveHierarchy(def);
      if (res.timestamp) setLastSaved(res.timestamp);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Hierarchy Reset',
          message: 'Organizational chart restored to verified corporate default.'
        });
      }
    }
  };

  // Modal Handlers
  const handleOpenAddSeniorModal = (targetUser) => {
    setSelectedTargetUser(targetUser);
    setModalSelectedPersonId('');
    setActiveModal('add-senior');
  };

  const handleConfirmAddSenior = () => {
    if (!selectedTargetUser || !modalSelectedPersonId) return;
    const res = addSeniorToUser(selectedTargetUser.user_id, modalSelectedPersonId);
    if (!res.success) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Cannot Add Senior',
          message: res.reason
        });
      }
      return;
    }
    setDb({ ...res.db });
    setHasUnsavedChanges(true);
    setActiveModal(null);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Senior Added',
        message: `${modalSelectedPersonId} is now a Senior to ${selectedTargetUser.name}.`
      });
    }
  };

  const handleOpenAddJuniorModal = (targetUser) => {
    setSelectedTargetUser(targetUser);
    setModalSelectedPersonId('');
    setActiveModal('add-junior');
  };

  const handleConfirmAddJunior = () => {
    if (!selectedTargetUser || !modalSelectedPersonId) return;
    const res = addJuniorToUser(selectedTargetUser.user_id, modalSelectedPersonId);
    if (!res.success) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Cannot Add Junior',
          message: res.reason
        });
      }
      return;
    }
    setDb({ ...res.db });
    setHasUnsavedChanges(true);
    setActiveModal(null);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Junior Added',
        message: `${modalSelectedPersonId} is now a Junior under ${selectedTargetUser.name}.`
      });
    }
  };

  const handleOpenEditTitleModal = (targetUser) => {
    setSelectedTargetUser(targetUser);
    setJobTitleInput(targetUser.job_title || '');
    setActiveModal('edit-title');
  };

  const handleConfirmEditTitle = () => {
    if (!selectedTargetUser || !jobTitleInput.trim()) return;
    const updated = updateEmployeeJobTitle(selectedTargetUser.user_id, jobTitleInput.trim());
    setDb({ ...updated });
    setHasUnsavedChanges(true);
    setActiveModal(null);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Job Title Updated',
        message: `Designation updated for ${selectedTargetUser.name}.`
      });
    }
  };

  // Toggle card collapsed state in right panel
  const toggleCardCollapse = (userId) => {
    setCollapsedCards((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Filtered rows for main table
  const tableRows = useMemo(() => {
    const list = Object.values(db);
    return list.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.user_id.toLowerCase().includes(q) ||
        (item.job_title || '').toLowerCase().includes(q) ||
        (item.senior_ids || []).some((id) => id.toLowerCase().includes(q)) ||
        (item.junior_ids || []).some((id) => id.toLowerCase().includes(q));

      const matchStage = selectedStage === 'All' || item.stage === Number(selectedStage);
      return matchSearch && matchStage;
    });
  }, [db, search, selectedStage]);

  // Right column employee list: ONLY those NOT present inside the flow chart (db)
  const rightPanelEmployees = useMemo(() => {
    const chartUserIds = new Set(Object.keys(db));

    // Filter employees from employee directory who are NOT present in the flowchart (db)
    const unassignedList = employees.filter((emp) => {
      const uid = emp.userid || emp.user_id;
      return uid && !chartUserIds.has(uid);
    });

    return unassignedList.filter((item) => {
      const q = rightPanelSearch.toLowerCase().trim();
      const name = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.name || '';
      const uid = item.userid || item.user_id || '';
      const title = item.designation || item.job_title || '';
      const dept = item.department || '';
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        uid.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        dept.toLowerCase().includes(q)
      );
    });
  }, [employees, db, rightPanelSearch]);

  // Summary Metrics
  const totalEmployees = Object.keys(db).length;
  const multiSeniorCount = Object.values(db).filter((u) => u.senior_ids && u.senior_ids.length > 1).length;
  const stage1Count = Object.values(db).filter((u) => u.stage === 1).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizational Hierarchy & Reporting Matrix"
        subtitle="Manage multi-tier enterprise reporting with Senior & Junior linkages (max 6), comma-separated person IDs, drag-and-drop auto creation, and stage progression."
        breadcrumbs={['HRMS', 'Hierarchy Matrix']}
        actions={
          <div className="flex items-center flex-wrap gap-2">
            {lastSaved && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[#059669] font-medium bg-[#ECFDF5] px-2.5 py-1 rounded-lg border border-[#A7F3D0]">
                <Check className="w-3.5 h-3.5" />
                Saved at {lastSaved}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#D97706] font-medium bg-[#FFFBEB] px-2.5 py-1 rounded-lg border border-[#FDE68A]">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                Unsaved Changes
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              disabled={isSaving}
              onClick={handleSaveHierarchy}
              className={hasUnsavedChanges ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm ring-2 ring-[#818CF8]' : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'}
              title="Save all hierarchy relationships and reporting structure"
            >
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={handleLoadSaved}
              title="Reload the last saved structure"
            >
              Load Saved
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              className={isRefreshing ? '[&_svg]:animate-spin text-[#4F46E5]' : ''}
              disabled={isRefreshing}
              onClick={() => handleSyncTeam(true)}
              title="Sync latest personnel from team directory"
            >
              {isRefreshing ? 'Syncing...' : 'Sync Team'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetHierarchy}
              title="Reset hierarchy to standard corporate structure"
            >
              Reset to Default
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={isRightPanelCollapsed ? Users : X}
              onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            >
              {isRightPanelCollapsed ? 'Show Person Cards' : 'Hide Cards'}
            </Button>
          </div>
        }
      />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368]">Total Mapped Personnel</span>
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2 font-mono">{totalEmployees}</p>
          <span className="text-[11px] text-[#059669] font-medium">Mapped organizational nodes</span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368]">Matrixed (Multiple Seniors)</span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2 font-mono">{multiSeniorCount}</p>
          <span className="text-[11px] text-[#5F6368]">e.g. Person A under B and C</span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368]">Stage 1 Top Executives</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDF4FF] text-[#A855F7] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2 font-mono">{stage1Count}</p>
          <span className="text-[11px] text-[#5F6368]">Top-level leadership heads</span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368]">Max Relations Limit</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2 font-mono">Max {MAX_RELATIONS}</p>
          <span className="text-[11px] text-[#5F6368]">Max 6 Seniors & 6 Juniors per person</span>
        </div>
      </div>

      {/* Main Two-Column Layout: Table (Left/Center) + Person Cards Column (Right) */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Main Content Area (Left/Center) */}
        <div className={`w-full transition-all duration-300 ${isRightPanelCollapsed ? 'lg:w-full' : 'lg:w-[72%]'}`}>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            {/* Filter & Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter table by name, user_id, job title, or senior/junior IDs..."
                  className="w-full pl-9 pr-8 text-xs h-9 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#111827]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Stage Filter & View Switcher */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="text-xs h-9 rounded-lg border border-[#E5E7EB] bg-white px-2.5"
                >
                  <option value="All">All Stages (1 to {MAX_STAGES})</option>
                  <option value="1">Stage 1: Executive</option>
                  <option value="2">Stage 2: Director/VP</option>
                  <option value="3">Stage 3: Lead/Manager</option>
                  <option value="4">Stage 4: Senior</option>
                  <option value="5">Stage 5: Associate</option>
                </select>

                <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded-lg border border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setViewMode('flowchart')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      viewMode === 'flowchart' ? 'bg-white text-[#4F46E5] shadow-xs' : 'text-[#5F6368]'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    Flow Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      viewMode === 'table' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#5F6368]'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    Matrix Table
                  </button>
                </div>
              </div>
            </div>

            {/* Drag and Drop Instruction Banner */}
            <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#E0E7FF] text-xs text-[#3730A3] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4F46E5] shrink-0" />
                <span>
                  {viewMode === 'flowchart' ? (
                    <>
                      <strong>Interactive Flow Chart:</strong> Directed arrows connect Seniors to Juniors. Drag handles to link reporting lines. Drag any person card from the right column directly onto the canvas or onto a node's dropzone!
                    </>
                  ) : (
                    <>
                      <strong>Interactive Matrix Table:</strong> Grab any person card from the right column and drop onto the <strong>Seniors</strong> cell to report under them, or onto the <strong>Juniors</strong> cell to manage them.
                    </>
                  )}
                </span>
              </div>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded text-[#4F46E5] border border-[#E0E7FF] shrink-0">
                Max 6 / Role
              </span>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#5F6368] font-semibold">
                      <th className="py-3 px-3.5">Person ID & Details</th>
                      <th className="py-3 px-3">Job Title</th>
                      <th className="py-3 px-3 text-center">Stage</th>
                      <th className="py-3 px-3">
                        <div className="flex items-center justify-between">
                          <span>Seniors (Reports Under)</span>
                          <span className="text-[10px] font-mono text-[#9CA3AF]">Max 6</span>
                        </div>
                      </th>
                      <th className="py-3 px-3">
                        <div className="flex items-center justify-between">
                          <span>Juniors (Works Under)</span>
                          <span className="text-[10px] font-mono text-[#9CA3AF]">Max 6</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center">Under / Managing</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {tableRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-[#9CA3AF]">
                          No records match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      tableRows.map((person) => {
                        const isSeniorDropTarget =
                          dropTarget?.userId === person.user_id && dropTarget?.role === 'senior';
                        const isJuniorDropTarget =
                          dropTarget?.userId === person.user_id && dropTarget?.role === 'junior';
                        const stageInfo = STAGE_CONFIG[person.stage] || STAGE_CONFIG[5];

                        const seniorIdsString = (person.senior_ids || []).join(', ');
                        const juniorIdsString = (person.junior_ids || []).join(', ');

                        return (
                          <tr
                            key={person.user_id}
                            className="hover:bg-[#F9FAFB]/80 transition-colors"
                          >
                            {/* Person ID & Details */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  src={person.profile_pic_url}
                                  avatarId={person.avatar_id}
                                  name={person.name}
                                  size="sm"
                                  className="border border-[#E5E7EB]"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      onClick={() => onSelectEmployee && onSelectEmployee(person.user_id)}
                                      className="font-bold text-[#111827] hover:text-[#4F46E5] cursor-pointer truncate max-w-[130px]"
                                      title={person.name}
                                    >
                                      {person.name}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[10px] text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.5 rounded border border-[#E0E7FF] font-semibold">
                                    {person.user_id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Job Title */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1 group">
                                <span className="font-medium text-[#27292C] truncate max-w-[140px]" title={person.job_title}>
                                  {person.job_title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTitleModal(person)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9CA3AF] hover:text-[#4F46E5] transition-opacity"
                                  title="Edit Job Title"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[10px] text-[#9CA3AF] block truncate max-w-[140px]">
                                {person.department}
                              </span>
                            </td>

                            {/* Stage */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageInfo.badge}`}
                              >
                                Stage {person.stage}
                              </span>
                              <span className="block text-[9px] text-[#9CA3AF] mt-0.5">
                                {stageInfo.name.split('/')[0]}
                              </span>
                            </td>

                            {/* Seniors (Reports Under) - Drop Zone */}
                            <td
                              onDragOver={(e) => handleDragOverCell(e, person.user_id, 'senior')}
                              onDragLeave={handleDragLeaveCell}
                              onDrop={(e) => handleDropOnCell(e, person.user_id, 'senior')}
                              className={`py-3 px-3 transition-all ${
                                isSeniorDropTarget
                                  ? 'bg-emerald-50 border-2 border-dashed border-emerald-500 rounded-lg'
                                  : ''
                              }`}
                            >
                              <div className="space-y-1.5">
                                {person.senior_ids && person.senior_ids.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {person.senior_ids.map((sId) => (
                                      <span
                                        key={sId}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#111827] text-[11px] font-mono border border-[#E5E7EB]"
                                        title={`Senior: ${db[sId]?.name || sId} (${sId})`}
                                      >
                                        <span className="font-semibold">{sId}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSenior(person.user_id, sId)}
                                          className="text-[#9CA3AF] hover:text-[#EF4444]"
                                          title={`Remove ${sId}`}
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-[#9CA3AF] italic">
                                    None (Top-Level)
                                  </span>
                                )}

                                {/* Comma string representation & Add button */}
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="font-mono text-[9px] text-[#6B7280] truncate max-w-[120px]" title={seniorIdsString}>
                                    {seniorIdsString ? `[${seniorIdsString}]` : ''}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddSeniorModal(person)}
                                    disabled={person.senior_ids.length >= MAX_RELATIONS}
                                    className="text-[10px] text-[#4F46E5] hover:underline font-semibold flex items-center gap-0.5 disabled:opacity-40"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> Senior ({person.senior_ids.length}/{MAX_RELATIONS})
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Juniors (Works Under Them) - Drop Zone */}
                            <td
                              onDragOver={(e) => handleDragOverCell(e, person.user_id, 'junior')}
                              onDragLeave={handleDragLeaveCell}
                              onDrop={(e) => handleDropOnCell(e, person.user_id, 'junior')}
                              className={`py-3 px-3 transition-all ${
                                isJuniorDropTarget
                                  ? 'bg-blue-50 border-2 border-dashed border-blue-500 rounded-lg'
                                  : ''
                              }`}
                            >
                              <div className="space-y-1.5">
                                {person.junior_ids && person.junior_ids.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {person.junior_ids.map((jId) => (
                                      <span
                                        key={jId}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F0FDF4] text-[#166534] text-[11px] font-mono border border-[#BBF7D0]"
                                        title={`Junior: ${db[jId]?.name || jId} (${jId})`}
                                      >
                                        <span className="font-semibold">{jId}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveJunior(person.user_id, jId)}
                                          className="text-[#9CA3AF] hover:text-[#EF4444]"
                                          title={`Remove ${jId}`}
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-[#9CA3AF] italic">
                                    None (Individual Contributor)
                                  </span>
                                )}

                                {/* Comma string representation & Add button */}
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="font-mono text-[9px] text-[#6B7280] truncate max-w-[120px]" title={juniorIdsString}>
                                    {juniorIdsString ? `[${juniorIdsString}]` : ''}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddJuniorModal(person)}
                                    disabled={person.junior_ids.length >= MAX_RELATIONS}
                                    className="text-[10px] text-[#059669] hover:underline font-semibold flex items-center gap-0.5 disabled:opacity-40"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> Junior ({person.junior_ids.length}/{MAX_RELATIONS})
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Under / Managing Metric Pill */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <span className="text-[10px] font-mono font-bold text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#E0E7FF]">
                                  Under: {person.senior_ids.length}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                                  Manages: {person.junior_ids.length}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTitleModal(person)}
                                  className="p-1 text-[#5F6368] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition-colors"
                                  title="Edit Designation"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePerson(person.user_id)}
                                  className="p-1 text-[#5F6368] hover:text-[#DC2626] hover:bg-rose-50 rounded transition-colors"
                                  title={`Remove ${person.name} from flow chart & matrix`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSelectEmployee && onSelectEmployee(person.user_id)}
                                  className="p-1 text-[#5F6368] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition-colors"
                                  title="View Dossier"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Interactive Flow Chart View */}
            {viewMode === 'flowchart' && (
              <OrgFlowchartCanvas
                db={db}
                onUpdateDb={(newDb) => setDb(newDb)}
                onRemovePerson={handleRemovePerson}
                onAddPersonToCanvas={handleAddPersonFromRoster}
                onSelectEmployee={onSelectEmployee}
                onOpenAddSeniorModal={handleOpenAddSeniorModal}
                onOpenAddJuniorModal={handleOpenAddJuniorModal}
                onOpenEditTitleModal={handleOpenEditTitleModal}
                onShowToast={onShowToast}
              />
            )}
          </div>
        </div>

        {/* Right Column: Unassigned Person Cards (Collapsed & Draggable) */}
        {!isRightPanelCollapsed && (
          <div className="w-full lg:w-[28%] bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 sticky top-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-sm font-bold text-[#111827]">Available Personnel</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSyncTeam(true)}
                  disabled={isRefreshing}
                  className="p-1 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded transition-colors"
                  title="Reload available team members"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#4F46E5]' : ''}`} />
                </button>
                <span className="font-mono text-xs font-semibold bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 rounded-full border border-[#E0E7FF]">
                  {rightPanelEmployees.length} Unassigned
                </span>
              </div>
            </div>

            {/* Live Directory Sync Indicator */}
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] px-1">
              <span className="flex items-center gap-1.5 text-[10px] text-[#059669] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                Live Directory
              </span>
              {lastSynced && (
                <span className="text-[10px] text-[#9CA3AF] font-mono">
                  Synced: {lastSynced}
                </span>
              )}
            </div>

            {/* Quick Search within Right Column */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rightPanelSearch}
                onChange={(e) => setRightPanelSearch(e.target.value)}
                placeholder="Search unassigned personnel..."
                className="w-full pl-8 pr-2.5 text-xs h-8 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] focus:border-[#4F46E5]"
              />
            </div>

            <p className="text-[11px] text-[#5F6368]">
              Showing personnel <strong>not currently in the flowchart</strong>. Drag onto the canvas or click <strong>+ Add to Chart</strong>.
            </p>

            {/* Collapsed / Expandable Cards Container */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {rightPanelEmployees.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
                  <div className="w-10 h-10 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#111827]">All Employees Placed</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Every active team member is currently mapped inside the flowchart.
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] mt-2">
                    To unassign a person and return them here, click the trash icon next to Edit on their node.
                  </p>
                </div>
              ) : (
                rightPanelEmployees.map((emp) => {
                  const uid = emp.userid || emp.user_id;
                  const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name || uid;
                  const jobTitle = emp.designation || emp.job_title || 'Staff Member';
                  const dept = emp.department || 'Corporate';
                  const picUrl = emp.profile_pic_url || emp.photo_url || emp.avatar_url;
                  const isCardOpen = !!collapsedCards[uid];
                  const isDragging = draggedUserId === uid;

                  return (
                    <div
                      key={uid}
                      draggable
                      onDragStart={(e) => handleDragStart(e, uid)}
                      className={`rounded-xl border transition-all cursor-grab active:cursor-grabbing p-3 select-none ${
                        isDragging
                          ? 'opacity-40 border-dashed border-[#6366F1] bg-[#EEF2FF]'
                          : 'border-[#E5E7EB] bg-white hover:border-[#4F46E5] hover:shadow-xs'
                      }`}
                    >
                      {/* Collapsed Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            src={picUrl}
                            avatarId={emp.avatar_id}
                            name={fullName}
                            size="sm"
                            className="border border-[#E5E7EB]"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[#111827] truncate">
                              {fullName}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[9px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-1.5 rounded">
                                {uid}
                              </span>
                              <span className="text-[9px] font-medium text-[#6B7280] bg-[#F3F4F6] px-1.5 rounded truncate max-w-[100px]">
                                {dept}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <div
                            title="Drag onto Flow Chart or Node"
                            className="p-1 text-[#9CA3AF] hover:text-[#4F46E5] cursor-grab"
                          >
                            <Move className="w-3.5 h-3.5" />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCardCollapse(uid)}
                            className="p-1 text-[#9CA3AF] hover:text-[#111827] rounded"
                            title={isCardOpen ? 'Collapse card' : 'Expand card details'}
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isCardOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#5F6368] truncate mt-1.5">
                        {jobTitle}
                      </p>

                      <div className="mt-2 pt-2 border-t border-[#F3F4F6] flex items-center justify-between">
                        <span className="text-[10px] text-[#9CA3AF] font-mono">Unassigned</span>
                        <button
                          type="button"
                          onClick={() => handleAddPersonFromRoster(uid)}
                          className="text-[10px] font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:bg-[#EEF2FF] px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title="Add this employee to the flow chart"
                        >
                          <Plus className="w-3 h-3" /> Add to Chart
                        </button>
                      </div>

                      {/* Expanded Details when Uncollapsed */}
                      {isCardOpen && (
                        <div className="mt-2 pt-2 border-t border-[#E5E7EB] space-y-2 text-[11px] bg-[#F9FAFB] p-2 rounded-lg">
                          <div>
                            <span className="font-semibold text-[#374151] block">Department:</span>
                            <span className="text-[#6B7280]">{dept}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#374151] block">Email:</span>
                            <span className="text-[#6B7280] font-mono text-[10px]">{emp.email || 'N/A'}</span>
                          </div>
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAddPersonFromRoster(uid)}
                              className="text-[10px] text-[#4F46E5] hover:underline font-semibold"
                            >
                              + Place on Chart
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Modal: Add Senior to Person                                           */}
      {/* --------------------------------------------------------------------- */}
      <Modal
        isOpen={activeModal === 'add-senior'}
        onClose={() => setActiveModal(null)}
        title={`Add Senior Manager for ${selectedTargetUser?.name || 'Employee'}`}
        size="md"
      >
        {selectedTargetUser && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center gap-3">
              <Avatar
                src={selectedTargetUser.profile_pic_url}
                avatarId={selectedTargetUser.avatar_id}
                name={selectedTargetUser.name}
                size="md"
              />
              <div>
                <h4 className="font-bold text-sm text-[#111827]">{selectedTargetUser.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-[#4F46E5] font-semibold">
                    {selectedTargetUser.user_id}
                  </span>
                  <span>•</span>
                  <span className="text-xs text-[#5F6368]">{selectedTargetUser.job_title}</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Current Seniors ({selectedTargetUser.senior_ids.length}/{MAX_RELATIONS}):{' '}
                  <span className="font-mono text-[#4F46E5]">
                    {selectedTargetUser.senior_ids.join(', ') || 'None'}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Select Senior to Add (Employee to Report Under):
              </label>
              <select
                value={modalSelectedPersonId}
                onChange={(e) => setModalSelectedPersonId(e.target.value)}
                className="w-full text-xs h-10 rounded-lg border border-[#E5E7EB] bg-white px-3"
              >
                <option value="">-- Choose Employee (by Name & user_id) --</option>
                {Object.values(db)
                  .filter(
                    (p) =>
                      p.user_id !== selectedTargetUser.user_id &&
                      !selectedTargetUser.senior_ids.includes(p.user_id)
                  )
                  .map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.name} ({p.user_id}) - Stage {p.stage} ({p.job_title})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                disabled={!modalSelectedPersonId}
                onClick={handleConfirmAddSenior}
              >
                Add Senior
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --------------------------------------------------------------------- */}
      {/* Modal: Add Junior to Person                                           */}
      {/* --------------------------------------------------------------------- */}
      <Modal
        isOpen={activeModal === 'add-junior'}
        onClose={() => setActiveModal(null)}
        title={`Add Junior Subordinate for ${selectedTargetUser?.name || 'Manager'}`}
        size="md"
      >
        {selectedTargetUser && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center gap-3">
              <Avatar
                src={selectedTargetUser.profile_pic_url}
                avatarId={selectedTargetUser.avatar_id}
                name={selectedTargetUser.name}
                size="md"
              />
              <div>
                <h4 className="font-bold text-sm text-[#111827]">{selectedTargetUser.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-[#059669] font-semibold">
                    {selectedTargetUser.user_id}
                  </span>
                  <span>•</span>
                  <span className="text-xs text-[#5F6368]">{selectedTargetUser.job_title}</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Current Juniors ({selectedTargetUser.junior_ids.length}/{MAX_RELATIONS}):{' '}
                  <span className="font-mono text-[#059669]">
                    {selectedTargetUser.junior_ids.join(', ') || 'None'}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Select Junior to Add (Person to Work Under {selectedTargetUser.name.split(' ')[0]}):
              </label>
              <select
                value={modalSelectedPersonId}
                onChange={(e) => setModalSelectedPersonId(e.target.value)}
                className="w-full text-xs h-10 rounded-lg border border-[#E5E7EB] bg-white px-3"
              >
                <option value="">-- Choose Employee (by Name & user_id) --</option>
                {Object.values(db)
                  .filter(
                    (p) =>
                      p.user_id !== selectedTargetUser.user_id &&
                      !selectedTargetUser.junior_ids.includes(p.user_id)
                  )
                  .map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.name} ({p.user_id}) - Stage {p.stage} ({p.job_title})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                disabled={!modalSelectedPersonId}
                onClick={handleConfirmAddJunior}
              >
                Add Junior
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --------------------------------------------------------------------- */}
      {/* Modal: Edit Job Title                                                 */}
      {/* --------------------------------------------------------------------- */}
      <Modal
        isOpen={activeModal === 'edit-title'}
        onClose={() => setActiveModal(null)}
        title={`Edit Job Title for ${selectedTargetUser?.name || 'Employee'}`}
        size="sm"
      >
        {selectedTargetUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#27292C] mb-1">
                Job Title / Corporate Designation *
              </label>
              <input
                type="text"
                required
                value={jobTitleInput}
                onChange={(e) => setJobTitleInput(e.target.value)}
                placeholder="e.g. Senior Principal Architect"
                className="w-full text-xs h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 focus:border-[#4F46E5]"
              />
              <span className="text-[11px] font-mono text-[#5F6368] mt-1 block">
                Target user_id: {selectedTargetUser.user_id}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <Button variant="secondary" size="sm" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                onClick={handleConfirmEditTitle}
              >
                Save Job Title
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
