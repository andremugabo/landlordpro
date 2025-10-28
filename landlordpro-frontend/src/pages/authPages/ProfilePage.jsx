import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Input, Modal } from "../../components";
import { FiEdit, FiMail, FiPhone, FiCamera, FiUser, FiX } from "react-icons/fi";
import defaultAvatar from "../../assets/react.svg";
import { getProfile, updateProfile, uploadAvatar } from "../../services/userService";
import { showSuccess, showError } from "../../utils/toastHelper";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch profile on mount
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

  // Handle profile save
  const handleSave = async () => {
    if (saving) return; // Prevent double submission

    try {
      setSaving(true);

      // Validate inputs
      if (!editData.full_name?.trim()) {
        showError("Full name is required");
        return;
      }

      if (!editData.email?.trim()) {
        showError("Email is required");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        showError("Please enter a valid email address");
        return;
      }

      // If avatar is a File object, upload it first
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

  // Handle avatar selection
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB");
      return;
    }

    setEditData({ ...editData, avatar: file });
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Clear avatar preview when modal closes
  const handleCloseModal = useCallback(() => {
    setEditModalOpen(false);
    setAvatarPreview(null);
    setEditData({});
  }, []);

  // Open edit modal with current user data
  const handleEditClick = () => {
    setEditData({ ...user });
    setAvatarPreview(null);
    setEditModalOpen(true);
  };

  // Remove avatar preview
  const handleRemovePreview = () => {
    setAvatarPreview(null);
    setEditData({ ...editData, avatar: user.avatar });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  const displayAvatar = avatarPreview || user.avatar || defaultAvatar;

  return (
    <div className="px-4 sm:px-8 py-12 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">My Profile</h1>
        <Button
          onClick={handleEditClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition"
        >
          <FiEdit /> Edit Profile
        </Button>
      </div>

      <Card className="p-6 bg-white shadow-md rounded-2xl border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="relative flex-shrink-0">
            <img
              src={displayAvatar}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-sm"
              onError={(e) => {
                e.target.src = defaultAvatar;
              }}
            />
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full">
              <FiUser size={20} />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-4 w-full">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">{user.full_name}</h2>
              <p className="text-blue-600 font-medium mt-1 capitalize">{user.role}</p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiMail className="text-blue-600" size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiPhone className="text-blue-600" size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">Phone</p>
                  <p className="text-sm">{user.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Info Card */}
      <Card className="p-6 bg-white shadow-md rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Member Since</p>
            <p className="text-sm text-gray-700">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Account Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </Card>

      {editModalOpen && (
        <Modal
          title="Edit Profile"
          onClose={handleCloseModal}
          onSubmit={handleSave}
          submitDisabled={saving || uploadingAvatar}
          submitText={saving ? "Saving..." : uploadingAvatar ? "Uploading..." : "Save Changes"}
          className="max-w-full sm:max-w-md w-full"
        >
          <div className="space-y-5">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src={avatarPreview || editData.avatar || defaultAvatar}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                  onError={(e) => {
                    e.target.src = defaultAvatar;
                  }}
                />
                {avatarPreview && (
                  <button
                    onClick={handleRemovePreview}
                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg cursor-pointer transition border border-blue-200">
                <FiCamera size={16} />
                <span className="text-sm font-medium">Change Photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500">Max size: 5MB (JPG, PNG, GIF)</p>
            </div>

            <Input
              label="Full Name"
              value={editData.full_name || ''}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
            <Input
              label="Email"
              type="email"
              value={editData.email || ''}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              required
              placeholder="your.email@example.com"
            />
            <Input
              label="Phone"
              value={editData.phone || ''}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              placeholder="+1234567890 (optional)"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;