import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Input, Button } from '../../components';
import { FiUser, FiMail, FiPhone, FiCamera, FiLock, FiShield, FiCheck } from 'react-icons/fi';
import defaultAvatar from '../../assets/react.svg';
import {
  getProfile,
  updateProfile,
  updatePassword,
  uploadAvatar,
} from '../../services/userService';
import { showError, showSuccess } from '../../utils/toastHelper';

const initialPasswordState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const AdminSettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState(initialPasswordState);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const response = await getProfile();
      const user = response?.user || response;
      setProfile(user);
      setProfileForm({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
    } catch (error) {
      console.error(error);
      showError(error?.message || 'Failed to load profile');
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Cleanup preview URL when component unmounts or avatar changes
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const displayedAvatar = useMemo(() => {
    if (avatarPreviewUrl) return avatarPreviewUrl;
    if (profile?.avatar) return profile.avatar;
    return defaultAvatar;
  }, [profile, avatarPreviewUrl]);

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (savingProfile || uploadingAvatar) return;

    if (!profileForm.full_name.trim()) {
      showError('Full name is required');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(profileForm.email)) {
      showError('Please enter a valid email address');
      return;
    }

    try {
      // Upload avatar first if user selected a new one
      if (selectedAvatarFile) {
        setUploadingAvatar(true);
        await uploadAvatar(selectedAvatarFile);
        setUploadingAvatar(false);
      }

      // Then update profile info (name, email, phone)
      setSavingProfile(true);
      await updateProfile(profileForm);
      
      showSuccess('Profile updated successfully');
      
      // Reload profile to get fresh data including new avatar URL
      await loadProfile();
      
      // Clear avatar selection
      setSelectedAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }
    } catch (error) {
      console.error(error);
      showError(error?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (changingPassword) return;

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Please complete all password fields');
      return;
    }

    if (newPassword.length < 8) {
      showError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New password confirmation does not match');
      return;
    }

    try {
      setChangingPassword(true);
      await updatePassword({ oldPassword: currentPassword, newPassword });
      showSuccess('Password updated successfully');
      setPasswordForm(initialPasswordState);
    } catch (error) {
      console.error(error);
      showError(error?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarInput = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Avatar must be smaller than 5MB');
      return;
    }

    // Clean up old preview URL
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    // Store file and create preview URL
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full py-16 text-gray-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile, contact information, and security preferences.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 border rounded-xl shadow-sm">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <img
                src={displayedAvatar}
                alt="Avatar"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                onError={(event) => {
                  event.currentTarget.src = defaultAvatar;
                }}
              />
              <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow">
                <FiCamera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarInput} />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profile.full_name}</h2>
              <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
            </div>
            <div className="space-y-2 text-left text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FiMail className="text-blue-500" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-emerald-500" />
                <span>{profile.phone || 'No phone number'}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 border rounded-xl shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <FiUser className="text-blue-500" /> Profile details
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Keep your personal information up to date. This information is used across the platform.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full name"
                value={profileForm.full_name}
                onChange={(event) => handleProfileChange('full_name', event.target.value)}
                placeholder="Jane Doe"
              />
              <Input
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(event) => handleProfileChange('email', event.target.value)}
                placeholder="jane.doe@example.com"
              />
              <Input
                label="Phone"
                value={profileForm.phone}
                onChange={(event) => handleProfileChange('phone', event.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || uploadingAvatar}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {uploadingAvatar ? 'Uploading avatar...' : savingProfile ? 'Saving...' : 'Save profile'}
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <FiLock className="text-emerald-500" /> Password & security
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Update your password regularly to keep your account secure.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                placeholder="Enter current password"
              />
              <Input
                label="New password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                placeholder="Minimum 8 characters"
              />
              <Input
                label="Confirm new password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder="Repeat new password"
              />
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500 mt-2">
              <FiShield className="text-blue-500 mt-0.5" />
              <span>Use a strong password that includes numbers, symbols, and both upper and lower case letters.</span>
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 border rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FiCheck className="text-indigo-500" /> Security checklist
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Keep your account protected by following recommended practices.
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Review account activity regularly.</li>
          <li>• Use unique passwords for every system.</li>
          <li>• Update contact information after organisational changes.</li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;