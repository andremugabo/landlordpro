import React, { useState, useEffect } from "react";
import { Card, Button, Input, Modal } from "../../components";
import { FiEdit, FiMail, FiPhone, FiCamera } from "react-icons/fi";
import defaultAvatar from "../../assets/react.svg";
import { getProfile, updateProfile, uploadAvatar } from "../../services/userService";
import { showSuccess, showError } from "../../utils/toastHelper";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});

  // Fetch profile on mount
  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        setUser(profile.user);
      } catch (err) {
        showError("Failed to load profile");
      }
    })();
  }, []);

  // Handle profile save
  const handleSave = async () => {
    try {
      // If avatar is a File object, upload it first
      if (editData.avatar instanceof File) {
        const uploaded = await uploadAvatar(editData.avatar);
        editData.avatar = uploaded.avatar; // returned from backend
      }

      const updated = await updateProfile(editData);
      setUser(updated);
      setEditModalOpen(false);
      showSuccess("Profile updated successfully!");
    } catch (err) {
      showError(err.message || "Error updating profile");
    }
  };

  // Handle avatar selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData({ ...editData, avatar: file });
    }
  };

  if (!user) return <p className="text-center text-gray-500 py-10">Loading...</p>;

  return (
    <div className="px-4 sm:px-8 py-12 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">My Profile</h1>

      <Card className="p-6 bg-white shadow-md rounded-2xl flex flex-col sm:flex-row gap-6 items-center sm:items-start border border-gray-200">
        <div className="relative">
          <img
            src={
              editData.avatar
                ? editData.avatar instanceof File
                  ? URL.createObjectURL(editData.avatar)
                  : editData.avatar
                : user.avatar || defaultAvatar
            }
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-sm"
          />
          <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
            <FiCamera size={16} />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-semibold text-gray-800">{user.full_name}</h2>
          <p className="text-gray-500 mb-4">{user.role}</p>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 justify-center sm:justify-start">
              <FiMail className="text-blue-600" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 justify-center sm:justify-start">
              <FiPhone className="text-blue-600" />
              <span>{user.phone || "Not set"}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              setEditData(user);
              setEditModalOpen(true);
            }}
            className="mt-5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition w-full sm:w-auto"
          >
            <FiEdit /> Edit Profile
          </Button>
        </div>
      </Card>

      {editModalOpen && (
        <Modal
          title="Edit Profile"
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleSave}
          className="max-w-full sm:max-w-md w-full"
        >
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={editData.full_name}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-gray-600 border rounded-md p-2"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;
