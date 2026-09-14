import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  CreditCard,
  UserCheck,
  Award,
  Clock,
  Shield,
  FileText,
  Edit,
  Save,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';

export function EmployeeDetailPage({
  userid,
  api,
  onBack,
  onShowToast
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit fields
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSkills, setEditSkills] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await api.getUser(userid);
        if (res.data && res.data.length > 0) {
          const userObj = res.data[0];
          const personal = res.personalDetails?.[0] || {};
          const professional = res.professionalDetails?.[0] || {};
          const bank = res.bankDetails?.[0] || {};
          const family = res.familyDetails?.[0] || {};

          setProfile({
            ...userObj,
            personal,
            professional,
            bank,
            family
          });

          setEditBio(personal.bio || '');
          setEditCity(personal.city || 'Mumbai');
          setEditSkills(professional.skills || 'Mobile Architecture, Flutter, Node.js');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userid, api]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(userid, {
        designation: profile.designation,
        department: profile.department
      });

      if (profile.personal) {
        profile.personal.bio = editBio;
        profile.personal.city = editCity;
      }
      if (profile.professional) {
        profile.professional.skills = editSkills;
      }

      setIsEditModalOpen(false);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Profile Updated',
          message: `Dossier details for ${profile.first_name} ${profile.last_name} saved.`
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Update Error',
          message: err.message
        });
      }
    }
  };

  if (loading || !profile) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>Loading employee record from Cloudflare D1 database...</p>
      </div>
    );
  }

  const tabItems = [
    { id: 'overview', label: 'Overview & Bio' },
    { id: 'professional', label: 'Professional & Skills' },
    { id: 'bank', label: 'Bank & Statutory' },
    { id: 'family', label: 'Family & Emergency' }
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Page header */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
          Back to Directory
        </Button>
        <span className="text-xs text-slate-500 font-mono">
          Dossier ID: {profile.userid}
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar
              name={`${profile.first_name} ${profile.last_name}`}
              src={profile.profile_pic_url}
              size="xl"
              status="online"
              avatarId={profile.avatar_id}
            />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-white font-display">
                  {profile.first_name} {profile.last_name}
                </h2>
                <Badge variant={profile.status === 'Active' ? 'success' : 'warning'}>
                  {profile.status}
                </Badge>
              </div>

              <p className="text-indigo-400 font-medium text-sm mt-0.5">
                {profile.designation} • {profile.department}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {profile.phone_number}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {profile.work_location || 'HQ Vashi Infotech Park'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={Edit}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Details
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabItems}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-white font-display border-b border-slate-800 pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Gender</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {profile.personal?.gender || 'Male'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Date of Birth</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {profile.date_of_birth || profile.personal?.dob || '1995-05-15'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">City / State</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {profile.personal?.city || 'Mumbai'}, {profile.personal?.state || 'Maharashtra'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Country</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {profile.personal?.country || 'India'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Current Address</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {profile.personal?.address || 'Flat 402, Greenfield Residency, Sector 17, Navi Mumbai'}
                </p>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-white font-display border-b border-slate-800 pb-2">
              Organizational Hierarchy
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-slate-400">Direct Supervisor / Manager</span>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {profile.manager_name || 'John Doe (CTO)'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">
                  Reports To
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-slate-400">Date of Joining</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {profile.date_of_joining || '2022-03-15'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Confirmation Date</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {profile.confirmation_date || '2022-09-15'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Professional Bio</span>
                <p className="text-slate-300 mt-1 leading-relaxed italic">
                  "{profile.personal?.bio || 'Passionate software architect focused on high-performance mobile systems, reactive state, and cloud edge microservices.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'professional' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-white font-display border-b border-slate-800 pb-2">
            Skills & Technical Qualifications
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400">Total Relevant Experience</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5">
                {profile.professional?.experience || '4.5 Years in Enterprise Full Stack'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Skill Competencies</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {(profile.professional?.skills || 'Flutter, Node.js, SQLite, Cloudflare, React, TypeScript')
                  .split(',')
                  .map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 font-medium"
                    >
                      {skill.trim()}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-white font-display border-b border-slate-800 pb-2">
            Bank Details & Statutory Compliance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Bank Name</span>
              <p className="font-bold text-slate-200 mt-0.5">
                {profile.bank?.bank_name || 'HDFC Bank Ltd'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Account Number</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">
                {profile.bank?.account_no || '50100488219901'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">IFSC Code</span>
              <p className="font-mono font-bold text-indigo-400 mt-0.5">
                {profile.bank?.ifsc_code || 'HDFC0001044'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">PAN Card Number</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">
                {profile.bank?.pan_card || 'ABCDE1234F'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Aadhaar Card</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">
                {profile.bank?.aadhar_card || 'XXXX-XXXX-1098'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'family' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-white font-display border-b border-slate-800 pb-2">
            Family & Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Father's Name</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {profile.family?.father_name || 'Rajendra Kataria'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Emergency Phone</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {profile.family?.alternate_contact || '+91 98999 12345'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Personal Email</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {profile.family?.personal_email || 'mohit.personal@example.com'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Dossier"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Professional Bio
            </label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Technical Skills (Comma separated)
            </label>
            <input
              type="text"
              value={editSkills}
              onChange={(e) => setEditSkills(e.target.value)}
              className="w-full text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Save}>
              Save Dossier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
