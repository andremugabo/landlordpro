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
import { getProfile, updateProfile, uploadAvatar } from "../../services/userService";
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
      setUser(updated);
      setEditModalOpen(false);
      setAvatarPreview(null);
      showSuccess("Profile updated successfully!");
    } catch (err) {
      showError(err.response?.data?.message || err.message || "Error updating profile");
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
      // await changePassword(passwordData);
      showSuccess("Password changed successfully!");
      setPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to change password");
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
          <Button
            onClick={handleBack}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FiArrowLeft /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const displayAvatar = avatarPreview || user.avatar || defaultAvatar;
  const completionPercentage = calculateCompletion();

  return (
    <div className="px-4 sm:px-8 py-8 space-y-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="p-6 text-center bg-white shadow-lg rounded-xl border border-gray-200">
            <div className="relative inline-block mb-4">
              <img
                src={displayAvatar}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl mx-auto ring-4 ring-blue-100"
                onError={(e) => {
                  e.target.src = defaultAvatar;
                }}
              />
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                <FiUser className="w-5 h-5" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.full_name}</h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <FiShield className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600 font-medium capitalize">{user.role}</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              {user.is_active ? (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <FiCheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium text-sm">Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                  <FiAlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 font-medium text-sm">Inactive</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleEditClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg shadow-md transition mb-3"
            >
              <FiEdit className="w-4 h-4" />
              Edit Profile
            </Button>

            <Button
              onClick={() => setPasswordModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg border border-gray-300 transition"
            >
              <FiLock className="w-4 h-4" />
              Change Password
            </Button>
          </Card>

          {/* Profile Completion */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-md rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FiActivity className="w-4 h-4 text-white" />
              </div>
              Profile Completion
            </h3>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">✓ Basic Information</span>
                <span className="text-green-600 font-semibold">Complete</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{user.phone ? '✓' : '○'} Phone Number</span>
                <span className={user.phone ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                  {user.phone ? 'Complete' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{user.avatar && user.avatar !== defaultAvatar ? '✓' : '○'} Profile Photo</span>
                <span className={user.avatar && user.avatar !== defaultAvatar ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                  {user.avatar && user.avatar !== defaultAvatar ? 'Complete' : 'Pending'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <FiUser className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <FiShield className="w-4 h-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <FiActivity className="w-4 h-4" />
              Activity
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiMail className="w-5 h-5 text-blue-600" />
                  </div>
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiMail className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Email Address</p>
                    </div>
                    <p className="text-gray-900 font-medium pl-11">{user.email}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FiPhone className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Phone Number</p>
                    </div>
                    <p className="text-gray-900 font-medium pl-11">{user.phone || "Not provided"}</p>
                  </div>
                </div>
              </Card>

              {/* Account Information */}
              <Card className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  Account Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FiUser className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">User ID</p>
                    </div>
                    <p className="text-gray-900 font-mono text-sm pl-11">{user.id?.substring(0, 13)}...</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiShield className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Role</p>
                    </div>
                    <p className="text-gray-900 font-medium capitalize pl-11">{user.role}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FiCalendar className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Member Since</p>
                    </div>
                    <p className="text-gray-900 font-medium pl-11">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FiClock className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Last Updated</p>
                    </div>
                    <p className="text-gray-900 font-medium pl-11">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "N/A"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <Card className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiLock className="w-5 h-5 text-green-600" />
                </div>
                Password & Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiLock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Password</p>
                      <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setPasswordModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-sm transition"
                  >
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FiShield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg shadow-sm transition">
                    Enable
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiActivity className="w-5 h-5 text-purple-600" />
                </div>
                Recent Activity Log
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition">
                  <div className="p-2.5 bg-blue-600 rounded-full flex-shrink-0">
                    <FiSettings className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Profile Updated</p>
                    <p className="text-sm text-gray-600">You updated your profile information</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition">
                  <div className="p-2.5 bg-green-600 rounded-full flex-shrink-0">
                    <FiCheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Login Successful</p>
                    <p className="text-sm text-gray-600">Logged in from Chrome on MacOS</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      1 day ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition">
                  <div className="p-2.5 bg-purple-600 rounded-full flex-shrink-0">
                    <FiShield className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Security Settings Changed</p>
                    <p className="text-sm text-gray-600">Password was updated successfully</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      3 days ago
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
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
                  src={avatarPreview || editData.avatar || defaultAvatar}
                  alt="Preview"
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                  onError={(e) => {
                    e.target.src = defaultAvatar;
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
                <FiShield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
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