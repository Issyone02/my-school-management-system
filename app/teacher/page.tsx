'use client';

import { useUser } from '@clerk/nextjs';

export default function TeacherDashboard() {
  const { user } = useUser();

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Teacher Dashboard</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome, {user?.firstName}</h2>
        <p className="text-gray-700">Email: {user?.emailAddresses[0]?.emailAddress}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">My Classes</h3>
          <p className="text-3xl font-bold text-blue-600">3</p>
          <p className="text-gray-600 text-sm">Classes assigned</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Students</h3>
          <p className="text-3xl font-bold text-green-600">45</p>
          <p className="text-gray-600 text-sm">Total students</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Results Entered</h3>
          <p className="text-3xl font-bold text-purple-600">12</p>
          <p className="text-gray-600 text-sm">This term</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Mark Attendance
          </button>
          <button className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
            Enter Results
          </button>
        </div>
      </div>
    </div>
  );
}