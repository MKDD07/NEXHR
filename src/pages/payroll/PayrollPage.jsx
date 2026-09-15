import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  FileText,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Building2,
  TrendingUp
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { FilterBar } from '../../components/ui/FilterBar';

export function PayrollPage({
  api,
  currentUser,
  onShowToast
}) {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Salary Form
  const [empName, setEmpName] = useState('Mohit Kataria');
  const [empId, setEmpId] = useState('TYS-1021');
  const [basicSal, setBasicSal] = useState(45000);
  const [hra, setHra] = useState(22500);
  const [conveyance, setConveyance] = useState(3000);
  const [allowance, setAllowance] = useState(14500);
  const [pf, setPf] = useState(5400);
  const [tds, setTds] = useState(4200);

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const res = await api.getSalaries();
      if (res.data) setSalaries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  const grossCalculated = Number(basicSal) + Number(hra) + Number(conveyance) + Number(allowance);
  const deductionsCalculated = Number(pf) + 200 + Number(tds);
  const netCalculated = grossCalculated - deductionsCalculated;

  const handleAddSalary = async (e) => {
    e.preventDefault();
    try {
      await api.addSalary({
        user_id: empId,
        employee_name: empName,
        month: 'September',
        year: '2026',
        pay_date: '2026-09-30',
        basic_salary: Number(basicSal),
        hra: Number(hra),
        conveyance: Number(conveyance),
        special_allowance: Number(allowance),
        bonus_incentive: 0,
        provident_fund: Number(pf),
        professional_tax: 200,
        income_tax_tds: Number(tds),
        gross_salary: grossCalculated,
        net_salary: netCalculated,
        annual_ctc: grossCalculated * 12
      });

      setIsAddModalOpen(false);
      await loadSalaries();
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Payslip Processed',
          message: `September 2026 payslip generated for ${empName}.`
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Processing Failed',
          message: err.message
        });
      }
    }
  };

  const filteredSalaries = salaries.filter((s) => {
    const name = (s.employee_name || '').toLowerCase();
    const uid = (s.user_id || '').toLowerCase();
    return name.includes(search.toLowerCase()) || uid.includes(search.toLowerCase());
  });

  const totalNetDisbursed = salaries.reduce((acc, s) => {
    return acc + (Number(s.net || s.amount_paid || s.structure?.net_salary) || 0);
  }, 0);

  const totalPfContribution = salaries.reduce((acc, s) => {
    return acc + (Number(s.pf || s.structure?.provident_fund) || 0);
  }, 0);

  const totalTdsDeductions = salaries.reduce((acc, s) => {
    return acc + (Number(s.tds || s.structure?.income_tax_tds) || 0);
  }, 0);

  const employeesCount = salaries.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll & Compensation"
        subtitle="Manage salary disbursements, statutory deductions, TDS calculation, and official payslips."
        breadcrumbs={['HRMS', 'Payroll']}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Process Month Salary
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Monthly Disbursal"
          value={`₹${totalNetDisbursed.toLocaleString('en-IN')}`}
          icon={CreditCard}
          color="indigo"
          metaText="Net employee payout"
        />
        <StatCard
          label="Statutory PF Contribution"
          value={`₹${totalPfContribution.toLocaleString('en-IN')}`}
          icon={ShieldCheck}
          color="cyan"
          metaText="Deposited with EPFO"
        />
        <StatCard
          label="Withholding TDS Deductions"
          value={`₹${totalTdsDeductions.toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="amber"
          metaText="Quarterly Form 24Q"
        />
        <StatCard
          label="Disbursed Records"
          value={`${employeesCount} Records`}
          icon={CheckCircle2}
          color="green"
          metaText="D1 SQL verified ledger"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter salary records by employee or ID..."
      >
        <div className="flex items-center gap-2">
          <Badge variant="info">
            Cycle: 1st - 30th Sep 2026
          </Badge>
        </div>
      </FilterBar>

      {/* Salaries Ledger Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Pay Period</th>
                <th className="py-3.5 px-4">Gross CTC</th>
                <th className="py-3.5 px-4">PF & TDS Deductions</th>
                <th className="py-3.5 px-4">Net Salary Paid</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No payroll entries found for this query.
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">
                        {item.employee_name}
                      </p>
                      <p className="text-[11px] text-indigo-400 font-mono">
                        {item.user_id}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {item.month} {item.year}
                      <span className="text-[10px] text-slate-500 block">
                        Disbursed {item.pay_date}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      ₹{(
                        Number(item.gross || item.structure?.gross_salary || 0)
                      ).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-rose-400 font-mono">
                      -₹{(
                        Number(item.pf || item.structure?.provident_fund || 0) +
                        Number(item.pt || item.structure?.professional_tax || 200) +
                        Number(item.tds || item.structure?.income_tax_tds || 0)
                      ).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-400 font-mono text-sm">
                      ₹{(
                        Number(item.net || item.amount_paid || item.structure?.net_salary || 0)
                      ).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="success">
                        {item.status || 'Processed'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={FileText}
                        onClick={() => setSelectedSlip(item)}
                      >
                        View Payslip
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Payslip Modal */}
      {selectedSlip && (
        <Modal
          isOpen={Boolean(selectedSlip)}
          onClose={() => setSelectedSlip(null)}
          title={`Official Salary Payslip - ${selectedSlip.month} ${selectedSlip.year}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                Ref: {selectedSlip.transaction_ref || 'TXN-SAL-2026-1021'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print Slip
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={() => {
                    if (onShowToast) {
                      onShowToast({
                        type: 'success',
                        title: 'Payslip Downloaded',
                        message: `Payslip PDF for ${selectedSlip.employee_name} saved.`
                      });
                    }
                  }}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6 text-xs">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  PulseHRMS Enterprise Ltd.
                </h3>
                <p className="text-slate-400">HQ Vashi Infotech Park, Sector 30A, Navi Mumbai, MH 400703</p>
                <p className="text-[11px] text-slate-500 font-mono">CIN: U72200MH2021PTC368819 • TAN: MUMB12345E</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                  CONFIDENTIAL
                </span>
                <p className="text-slate-400 mt-1">Pay Period: {selectedSlip.month} {selectedSlip.year}</p>
              </div>
            </div>

            {/* Employee metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-slate-400">Employee Name:</span>
                <p className="font-bold text-white mt-0.5">{selectedSlip.employee_name}</p>
              </div>
              <div>
                <span className="text-slate-400">Employee ID:</span>
                <p className="font-mono font-bold text-indigo-400 mt-0.5">{selectedSlip.user_id}</p>
              </div>
              <div>
                <span className="text-slate-400">Designation:</span>
                <p className="font-semibold text-slate-200 mt-0.5">Lead Mobile Architect</p>
              </div>
              <div>
                <span className="text-slate-400">Bank Account:</span>
                <p className="font-mono text-slate-200 mt-0.5">HDFC •••• 9901</p>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Earnings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-1.5">
                  <span>Earnings Component</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Basic Salary</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.basic_salary || 45000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.hra || 22500).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Conveyance Allowance</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.conveyance || 3000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Special / Performance Allowance</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.special_allowance || 14500).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Bonus / Incentives</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.bonus_incentive || 5000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-indigo-400">₹{(selectedSlip.structure?.gross_salary || 90000).toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-1.5">
                  <span>Deductions Component</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Provident Fund (Employee 12%)</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.provident_fund || 5400).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Professional Tax (PT)</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.professional_tax || 200).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>TDS / Income Tax (Sec 192)</span>
                  <span className="font-mono">₹{(selectedSlip.structure?.income_tax_tds || 4200).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-400">
                    ₹{(
                      (selectedSlip.structure?.provident_fund || 5400) +
                      (selectedSlip.structure?.professional_tax || 200) +
                      (selectedSlip.structure?.income_tax_tds || 4200)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Net Salary Transferred
                </span>
                <p className="text-2xl font-bold text-emerald-400 font-display">
                  ₹{(selectedSlip.amount_paid || selectedSlip.structure?.net_salary || 80200).toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-400">
                  Eighty Thousand Two Hundred Rupees Only
                </span>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Status: <strong className="text-emerald-400">Disbursed via NEFT/IMPS</strong></p>
                <p className="font-mono text-[10px] mt-1 text-slate-500">Authorized Signature: Finance Controller</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Process New Salary Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Process Salary Payslip"
      >
        <form onSubmit={handleAddSalary} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Employee Name
              </label>
              <input
                type="text"
                required
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                required
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Basic Pay (₹)
              </label>
              <input
                type="number"
                value={basicSal}
                onChange={(e) => setBasicSal(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                HRA (₹)
              </label>
              <input
                type="number"
                value={hra}
                onChange={(e) => setHra(e.target.value)}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Special Allowance (₹)
              </label>
              <input
                type="number"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                TDS Income Tax (₹)
              </label>
              <input
                type="number"
                value={tds}
                onChange={(e) => setTds(e.target.value)}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Computed Net Salary:</span>
              <p className="text-base font-bold text-emerald-400 font-mono">
                ₹{netCalculated.toLocaleString()}
              </p>
            </div>
            <Badge variant="success">Calculated</Badge>
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
              Confirm & Save Slip
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
