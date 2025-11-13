import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Input, Modal } from "../../components";
import {
  FiEdit,
  FiMail,
  FiPhone,
  FiCamera,
  FiUser,
  FiX,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiUpload,
  FiShield,
  FiLock,
  FiActivity,
  FiSettings,
  FiEye,
  FiEyeOff,
  FiClock,
  FiMapPin
} from "react-icons/fi";
import defaultAvatar from "../../assets/react.svg";
import { getProfile, updateProfile, uploadAvatar, updatePassword } from "../../services/userService";
import { saveLoggedInUser } from "../../services/AuthService";
import { showSuccess, showError } from "../../utils/toastHelper";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      setUser(profile.user);
      saveLoggedInUser(profile.user);
    } catch (err) {
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      if (!editData.full_name?.trim()) {
        showError("Full name is required");
        return;
      }

      if (!editData.email?.trim()) {
        showError("Email is required");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        showError("Please enter a valid email address");
        return;
      }

      let avatarUrl = editData.avatar;
      if (editData.avatar instanceof File) {
        setUploadingAvatar(true);
        try {
          const uploaded = await uploadAvatar(editData.avatar);
          avatarUrl = uploaded.avatar;
        } catch (err) {
          showError("Failed to upload avatar");
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }

      const dataToUpdate = {
        ...editData,
        avatar: avatarUrl,
      };

      const updated = await updateProfile(dataToUpdate);
      const updatedUser = updated?.user || updated;
      setUser(updatedUser);
      saveLoggedInUser(updatedUser);
      setEditModalOpen(false);
      setAvatarPreview(null);
      showSuccess("Profile updated successfully!");
    } catch (err) {
      showError(err.message || err.response?.data?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showError("All password fields are required");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showError("New password must be at least 8 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    try {
      setSaving(true);
      await updatePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess("Password changed successfully!");
      setPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message || err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB");
      return;
    }

    setEditData({ ...editData, avatar: file });
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCloseModal = useCallback(() => {
    setEditModalOpen(false);
    setAvatarPreview(null);
    setEditData({});
  }, []);

  const handleEditClick = () => {
    setEditData({ ...user });
    setAvatarPreview(null);
    setEditModalOpen(true);
  };

  const handleRemovePreview = () => {
    setAvatarPreview(null);
    setEditData({ ...editData, avatar: user.avatar });
  };

  const calculateCompletion = () => {
    let completed = 0;
    let total = 5;

    if (user?.full_name) completed++;
    if (user?.email) completed++;
    if (user?.phone) completed++;
    if (user?.avatar && user.avatar !== defaultAvatar) completed++;
    if (user?.is_active) completed++;

    return Math.round((completed / total) * 100);
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const resolveAvatarUrl = (avatar) => {
    if (!avatar) return defaultAvatar;
    if (typeof avatar === 'string' && avatar.startsWith('http')) return avatar;
    if (typeof avatar === 'string' && avatar.startsWith('/uploads')) {
      const base = API_BASE_URL.replace(/\/$/, '');
      return `${base}${avatar}`;
    }
    return avatar;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiAlertCircle className="mx-auto text-red-500 text-4xl mb-4" />
          <p className="text-gray-500 mb-4">Failed to load profile</p>
          <div className="relative z-10">
            <Button
              onClick={handleBack}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FiArrowLeft /> Go Back
            </Button>
          </div>

        </div>
      </div>
    );
  }

  const displayAvatar = avatarPreview || resolveAvatarUrl(user.avatar);
  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative isolate overflow-hidden bg-linear-to-br from-slate-900 via-sky-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
            <div className="relative z-10">
                <Button
                  onClick={handleBack}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FiArrowLeft /> Go Back
                </Button>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Account Centre</p>
                <h1 className="text-3xl sm:text-4xl font-semibold mt-2">My Profile</h1>
                <p className="text-sm text-white/70 mt-2 max-w-lg">
                  Manage your personal information, security settings, and portfolio preferences in one place.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 min-w-[220px] md:min-w-[320px]">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-white/70">Account status</p>
                <p className="text-lg font-semibold mt-1">{user.is_active ? 'Active' : 'Inactive'}</p>
                <p className="text-[11px] text-white/60 mt-1">Signed in as {user.role}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-white/70">Profile completion</p>
                <p className="text-lg font-semibold mt-1">{completionPercentage}%</p>
                <p className="text-[11px] text-white/60 mt-1">Complete your contact details</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.4)_0,transparent_55%)]" aria-hidden="true" />
      </div>

      <div className="relative z-10 -mt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 sm:p-7 text-center bg-white shadow-xl rounded-2xl border border-slate-100">
                <div className="relative inline-block mb-5">
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl mx-auto ring-4 ring-sky-100"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultAvatar;
                    }}
                  />
                  <div className="absolute bottom-0 right-0 bg-sky-500 text-white p-2 rounded-full shadow-lg">
                    <FiUser className="w-5 h-5" />
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-slate-900 mb-1">{user.full_name}</h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <FiShield className="w-4 h-4 text-sky-500" />
                  <span className="text-sky-600 font-medium capitalize">{user.role}</span>
                </div>

                <div className="flex items-center justify-center gap-2 mb-6">
                  {user.is_active ? (
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-medium text-sm">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full">
                      <FiAlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-rose-700 font-medium text-sm">Inactive</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-sm text-slate-500 mb-6">
                  <div className="flex items-center gap-2 justify-center">
                    <FiMail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <FiPhone className="w-4 h-4" />
                    <span>{user.phone || 'No phone number'}</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button
                    onClick={handleEditClick}
                    className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg shadow-sm transition"
                  >
                    <FiEdit className="w-4 h-4" />
                    Edit Profile
                  </Button>

                  <Button
                    onClick={() => setPasswordModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg border border-slate-200 transition"
                  >
                    <FiLock className="w-4 h-4" />
                    Change Password
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-md rounded-2xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <FiActivity className="w-4 h-4 text-sky-500" />
                  </div>
                  Profile Completion
                </h3>
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2 text-sm text-slate-600">
                    <span>Overall Progress</span>
                    <span className="text-sky-600 font-semibold">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className="bg-linear-to-r from-sky-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Basic Information</span>
                    <span className="text-emerald-500 font-semibold">Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone Number</span>
                    <span className={user.phone ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                      {user.phone ? 'Complete' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Profile Photo</span>
                    <span className={user.avatar && user.avatar !== defaultAvatar ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                      {user.avatar && user.avatar !== defaultAvatar ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white shadow-md rounded-2xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <FiMail className="w-5 h-5 text-sky-500" />
                  </div>
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Email Address</div>
                    <p className="text-slate-900 font-medium">{user.email}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Phone Number</div>
                    <p className="text-slate-900 font-medium">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-md rounded-2xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-indigo-500" />
                  </div>
                  Account Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">User ID</div>
                    <p className="text-slate-900 font-mono text-sm">{user.id?.substring(0, 13)}...</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Role</div>
                    <p className="text-slate-900 font-medium capitalize">{user.role}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Member Since</div>
                    <p className="text-slate-900 font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Last Updated</div>
                    <p className="text-slate-900 font-medium">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-md rounded-2xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FiLock className="w-5 h-5 text-emerald-500" />
                  </div>
                  Password & Security Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <FiLock className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Password</p>
                        <p className="text-sm text-slate-600">Last changed 30 days ago</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setPasswordModalOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg shadow-sm transition"
                    >
                      Change
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <FiShield className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-600">Add an extra layer of security</p>
                      </div>
                    </div>
                    <Button className="bg-white hover:bg-slate-100 text-slate-700 px-5 py-2 rounded-lg border border-slate-200 shadow-sm transition">
                      Enable
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-md rounded-2xl border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiActivity className="w-5 h-5 text-purple-500" />
                  </div>
                  Recent Activity Log
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-linear-to-br from-slate-50 to-white rounded-xl border border-slate-100">
                    <div className="p-2.5 bg-sky-500 text-white rounded-full shrink-0">
                      <FiSettings className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Profile Updated</p>
                      <p className="text-sm text-slate-600">You updated your profile information</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <FiClock className="w-3 h-3" /> 2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-linear-to-br from-emerald-50 to-white rounded-xl border border-emerald-100">
                    <div className="p-2.5 bg-emerald-500 text-white rounded-full shrink-0">
                      <FiCheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Login Successful</p>
                      <p className="text-sm text-slate-600">Logged in from Chrome on macOS</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <FiClock className="w-3 h-3" /> 1 day ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-linear-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
                    <div className="p-2.5 bg-indigo-500 text-white rounded-full shrink-0">
                      <FiShield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Security Settings Changed</p>
                      <p className="text-sm text-slate-600">Password updated successfully</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <FiClock className="w-3 h-3" /> 3 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <Modal
          title="Edit Profile"
          onClose={handleCloseModal}
          onSubmit={handleSave}
          submitDisabled={saving || uploadingAvatar}
          submitText={
            saving ? "Saving Changes..." :
            uploadingAvatar ? "Uploading Avatar..." :
            "Save Changes"
          }
        >
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={avatarPreview || resolveAvatarUrl(editData.avatar)}
                  alt="Preview"
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                {avatarPreview && (
                  <button
                    onClick={handleRemovePreview}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-lg"
                    title="Remove new photo"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
                  <FiCamera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">
                JPG, PNG, GIF (Max 5MB)
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={editData.full_name || ''}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                required
                placeholder="Enter your full name"
              />
              <Input
                label="Email Address"
                type="email"
                value={editData.email || ''}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                required
                placeholder="your.email@example.com"
              />
              <Input
                label="Phone Number"
                value={editData.phone || ''}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="+1234567890 (optional)"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <Modal
          title="Change Password"
          onClose={() => {
            setPasswordModalOpen(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswords({ current: false, new: false, confirm: false });
          }}
          onSubmit={handlePasswordChange}
          submitDisabled={saving}
          submitText={saving ? "Changing..." : "Change Password"}
        >
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition"
              >
                {showPasswords.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                placeholder="Enter new password (min 8 chars)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition"
              >
                {showPasswords.new ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                placeholder="Confirm new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition"
              >
                {showPasswords.confirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiShield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-blue-800 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      At least 8 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Include uppercase and lowercase letters
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Include at least one number
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Include at least one special character
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;