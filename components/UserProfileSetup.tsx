import React, { useState } from 'react';
import { UserProfile, MedicalCondition } from '../types';
import MedicalConditionsSelector from './MedicalConditionsSelector';
import BMICalculator from './BMICalculator';
import StreakGoals from './StreakGoals';

interface UserProfileSetupProps {
  userProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onClose: () => void;
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ userProfile, onProfileUpdate, onClose }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);

  const handleConditionsUpdate = (conditions: MedicalCondition[], customCondition?: string) => {
    const updatedProfile = {
      ...profile,
      medicalConditions: conditions,
      customCondition
    };
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleBMIUpdate = (bmiData: any) => {
    const updatedProfile = {
      ...profile,
      bmi: bmiData
    };
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleGoalsUpdate = (goals: UserProfile['goals']) => {
    const updatedProfile = {
      ...profile,
      goals
    };
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleStreakUpdate = (streak: UserProfile['streak']) => {
    const updatedProfile = {
      ...profile,
      streak
    };
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
              <p className="text-green-100 mt-1">Set up your health information for personalized AI advice</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Medical Conditions */}
          <MedicalConditionsSelector
            selectedConditions={profile.medicalConditions}
            customCondition={profile.customCondition}
            onConditionsChange={handleConditionsUpdate}
          />

          {/* BMI Calculator */}
          <BMICalculator
            userProfile={profile}
            onBMIUpdate={handleBMIUpdate}
          />

          {/* Goals & Streak */}
          <StreakGoals
            userProfile={profile}
            onGoalsUpdate={handleGoalsUpdate}
            onStreakUpdate={handleStreakUpdate}
          />

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Save & Continue
            </button>
            <div className="text-sm text-gray-500 flex items-center">
              <span className="mr-2">💡</span>
              You can update these settings anytime from the profile menu
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserProfileSetup;
