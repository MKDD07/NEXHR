import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  FileText,
  Download,
  Shield,
  Eye,
  Lock,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FilterBar } from '../../components/ui/FilterBar';

export function DocumentsPage({
  api,
  onShowToast
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Doc Form
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Company Policy');
  const [docFormat, setDocFormat] = useState('PDF');

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      if (res.data) setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    try {
      await api.uploadDocument({
        title: docTitle,
        category: docCategory,
        format: docFormat,
        file_size: '2.4 MB',
        uploaded_by: 'HR Admin',
        upload_date: new Date().toISOString().split('T')[0]
      });

      setIsAddModalOpen(false);
      setDocTitle('');
      await loadDocs();

      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Document Published',
          message: `${docTitle} is now accessible in the company vault.`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchSearch =
      (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'All' || d.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents Vault & Policies"
        subtitle="Encrypted repository for enterprise policies, statutory tax forms, and personnel contracts."
        breadcrumbs={['HRMS', 'Vault']}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Upload Vault Document
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search policies, forms, or tax documents..."
      >
        <div className="flex items-center gap-2">
          <select
            className="filter-bar__select text-xs"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Company Policy">Company Policies</option>
            <option value="Tax & Compliance">Tax & Statutory</option>
            <option value="Onboarding">Onboarding Kit</option>
          </select>
        </div>
      </FilterBar>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="card p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300">
                  {doc.format} • {doc.file_size}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {doc.title}
                </h4>
                <p className="text-xs text-indigo-300 font-medium mt-0.5">
                  {doc.category}
                </p>
              </div>

              <p className="text-[11px] text-slate-400">
                Uploaded by {doc.uploaded_by} on {doc.upload_date}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <Shield className="w-3 h-3" /> Encrypted
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => {
                  if (onShowToast) {
                    onShowToast({
                      type: 'success',
                      title: 'Download Initiated',
                      message: `${doc.title} decrypted and downloading.`
                    });
                  }
                }}
              >
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Upload Document to Vault"
      >
        <form onSubmit={handleUploadDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Remote Work Security Guidelines 2026"
              className="w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full h-10 text-xs"
              >
                <option value="Company Policy">Company Policy</option>
                <option value="Tax & Compliance">Tax & Compliance</option>
                <option value="Onboarding">Onboarding Kit</option>
                <option value="Legal & NDA">Legal & NDA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                File Type
              </label>
              <select
                value={docFormat}
                onChange={(e) => setDocFormat(e.target.value)}
                className="w-full h-10 text-xs"
              >
                <option value="PDF">PDF Document</option>
                <option value="DOCX">Word Document (.docx)</option>
                <option value="XLSX">Spreadsheet (.xlsx)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center space-y-1 bg-slate-900/40">
            <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
            <p className="text-xs font-bold text-slate-200">Drag and drop file here, or click to browse</p>
            <p className="text-[11px] text-slate-500">PDF, DOCX up to 25MB. End-to-end AES-256 encrypted.</p>
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
              Upload to Vault
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
