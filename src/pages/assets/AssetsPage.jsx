import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Plus,
  Search,
  CheckCircle2,
  Shield,
  Monitor,
  Smartphone,
  HardDrive,
  UserCheck,
  Tag
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { FilterBar } from '../../components/ui/FilterBar';

export function AssetsPage({
  api,
  onShowToast
}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Asset Form
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [serialNo, setSerialNo] = useState('');
  const [assignedTo, setAssignedTo] = useState('Mohit Kataria');
  const [assignedId, setAssignedId] = useState('TYS-1021');

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await api.getAssets();
      if (res.data) setAssets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await api.createAsset({
        name: assetName,
        category,
        serial_number: serialNo,
        assigned_user: assignedTo,
        assigned_userid: assignedId,
        condition: 'Excellent',
        status: 'Assigned',
        issue_date: new Date().toISOString().split('T')[0]
      });

      setIsAddModalOpen(false);
      setAssetName('');
      setSerialNo('');
      await loadAssets();

      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Asset Allocated',
          message: `${assetName} registered to ${assignedTo}.`
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Asset Error',
          message: err.message
        });
      }
    }
  };

  const filteredAssets = assets.filter((a) => {
    const term = search.toLowerCase();
    return (
      (a.name || '').toLowerCase().includes(term) ||
      (a.serial_number || '').toLowerCase().includes(term) ||
      (a.assigned_user || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hardware & IT Asset Inventory"
        subtitle="Track company workstations, peripherals, warranty schedules, and hardware custodian assignments."
        breadcrumbs={['HRMS', 'Assets']}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Allocate Asset
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hardware Assets"
          value="176 Units"
          icon={Laptop}
          color="indigo"
          metaText="Laptops, screens, & test gear"
        />
        <StatCard
          label="Currently Deployed"
          value="158 Units"
          icon={UserCheck}
          color="green"
          metaText="Assigned to staff"
        />
        <StatCard
          label="In Central IT Pool"
          value="18 Units"
          icon={HardDrive}
          color="cyan"
          metaText="Ready for instant dispatch"
        />
        <StatCard
          label="Under AMC / Repair"
          value="2 Units"
          icon={Shield}
          color="amber"
          metaText="Apple authorized service"
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter assets by model, serial number, or assignee..."
      />

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Hardware Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Serial Number</th>
                <th className="py-3.5 px-4">Custodian / Assignee</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No hardware assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-400 text-[11px]">
                      {item.serial_number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{item.assigned_user}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{item.assigned_userid}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {item.issue_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.status === 'Assigned' ? 'success' : 'neutral'}>
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register & Allocate Hardware Asset"
      >
        <form onSubmit={handleAddAsset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asset Model & Name *
            </label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. MacBook Pro 16 M3 Max (32GB / 1TB)"
              className="w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 text-xs"
              >
                <option value="Laptop">Laptop Workstation</option>
                <option value="Display">Display Monitor</option>
                <option value="Mobile">Test Mobile Device</option>
                <option value="Accessory">Peripheral / Dock</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                required
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="e.g. C02G90XXMD6M"
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Employee Name
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={assignedId}
                onChange={(e) => setAssignedId(e.target.value)}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Asset Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
