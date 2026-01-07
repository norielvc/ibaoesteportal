import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, User, Shield, Bell, Palette } from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import { authAPI } from '@/lib/api';
import { getUserData, setUserData } from '@/lib/auth';

export default function Settings() {
  const currentUser = getUserData();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
    },
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.updateProfile(data);
      
      if (response.success) {
        // Update local user data
        setUserData(response.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      // Error is handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const ProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
        <p className="text-sm text-gray-500">Update your personal information and email address.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="label">
              First Name
            </label>
            <input
              {...register('firstName', {
                required: 'First name is required',
                maxLength: {
                  value: 50,
                  message: 'First name must be less than 50 characters',
                },
              })}
              type="text"
              className={errors.firstName ? 'input-error' : 'input'}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="label">
              Last Name
            </label>
            <input
              {...register('lastName', {
                required: 'Last name is required',
                maxLength: {
                  value: 50,
                  message: 'Last name must be less than 50 characters',
                },
              })}
              type="text"
              className={errors.lastName ? 'input-error' : 'input'}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email Address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            className={errors.email ? 'input-error' : 'input'}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
        <p className="text-sm text-gray-500">Manage your password and security preferences.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Password Change
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                To change your password, please use the edit profile option from the user management section.
                This ensures proper validation and security measures are in place.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <button className="btn-secondary text-sm">
            Enable 2FA
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Login Sessions</h4>
            <p className="text-sm text-gray-500">Manage your active login sessions</p>
          </div>
          <button className="btn-secondary text-sm">
            View Sessions
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Account Activity</h4>
            <p className="text-sm text-gray-500">Review recent account activity</p>
          </div>
          <button className="btn-secondary text-sm">
            View Activity
          </button>
        </div>
      </div>
    </div>
  );

  const NotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
        <p className="text-sm text-gray-500">Choose what notifications you want to receive.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            defaultChecked
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">User Activity</h4>
            <p className="text-sm text-gray-500">Get notified about user registrations and activities</p>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            defaultChecked
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">System Updates</h4>
            <p className="text-sm text-gray-500">Receive notifications about system updates and maintenance</p>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Security Alerts</h4>
            <p className="text-sm text-gray-500">Get notified about security-related events</p>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            defaultChecked
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const AppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
        <p className="text-sm text-gray-500">Customize the look and feel of your dashboard.</p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Theme</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                defaultChecked
              />
              <span className="ml-2 text-sm text-gray-700">Light</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Dark</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="system"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">System</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sidebar</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                defaultChecked
              />
              <span className="ml-2 text-sm text-gray-700">Compact sidebar</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-hide sidebar on mobile</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'security':
        return <SecurityTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'appearance':
        return <AppearanceTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <Layout title="Settings" subtitle="Manage your account settings and preferences">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-body">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}