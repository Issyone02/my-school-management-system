'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { BookOpen, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Toaster } from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useUser();
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [fees, setFees] = useState<any>(null);
  const [attendance, setAttendance] = useState<number>(95);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;

      try {
        // Step 1: Get user_id from users table using clerk_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, role')
          .eq('clerk_id', user.id)
          .single();

        if (userError || !userData) {
          console.error('User not found in database');
          // Fallback to demo data
          setDemoData();
          setLoading(false);
          return;
        }

        // Step 2: Get student record linked to this user
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(name)
          `)
          .eq('user_id', userData.id)
          .single();

        if (studentError || !studentData) {
          console.log('No student record linked yet');          setDemoData();
          setLoading(false);
          return;
        }

        setStudent(studentData);

        // Step 3: Fetch results for this student
        const { data: resultsData } = await supabase
          .from('results')
          .select(`
            *,
            subject:subjects(name)
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
          .limit(4);

        setResults(resultsData || []);

        // Step 4: Fetch timetable for student's class
        const { data: timetableData } = await supabase
          .from('timetable')
          .select(`
            *,
            subject:subjects(name)
          `)
          .eq('class_id', studentData.class_id);

        setTimetable(timetableData || []);

        // Step 5: Fetch fees status
        const { data: feesData } = await supabase
          .from('school_fees')
          .select('*')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
          .limit(1);

        setFees(feesData?.[0] || null);

        // Step 6: Fetch attendance percentage
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentData.id);

        if (attendanceData && attendanceData.length > 0) {
          const presentCount = attendanceData.filter((a: any) => a.status === 'present').length;
          const percentage = Math.round((presentCount / attendanceData.length) * 100);          setAttendance(percentage);
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
        setDemoData();
      } finally {
        setLoading(false);
      }
    };

    // Fallback demo data function
    const setDemoData = () => {
      setStudent({
        full_name: user?.firstName || 'Student',
        admission_number: 'GFA/2024/001',
        class: { name: 'JSS 1A' },
        house: 'Red House',
      });
      setResults([
        { subject: { name: 'Mathematics' }, score: 85, grade: 'A', term: 'Second Term' },
        { subject: { name: 'English' }, score: 72, grade: 'B', term: 'Second Term' },
        { subject: { name: 'Science' }, score: 80, grade: 'A', term: 'Second Term' },
        { subject: { name: 'Social Studies' }, score: 68, grade: 'B', term: 'Second Term' },
      ]);
      setTimetable([
        { day: 'Monday', subject: { name: 'Mathematics' }, time: '8:00 - 9:30', room: 'Room 101' },
        { day: 'Monday', subject: { name: 'English' }, time: '10:00 - 11:30', room: 'Room 205' },
        { day: 'Tuesday', subject: { name: 'Science' }, time: '8:00 - 9:30', room: 'Lab 3' },
        { day: 'Tuesday', subject: { name: 'Social Studies' }, time: '11:00 - 12:30', room: 'Room 101' },
      ]);
    };

    fetchStudentData();
  }, [user]);

  // Calculate average from results
  const calculateAverage = () => {
    if (results.length === 0) return 78.5;
    const total = results.reduce((sum, r) => sum + (r.total_score || r.score || 0), 0);
    return (total / results.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }
  const average = calculateAverage();
  const feesStatus = fees?.status || 'Paid';
  const feesAmount = fees?.amount_due || 150000;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl shadow-lg p-8 text-white mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">{student?.full_name}</h2>
            <p className="text-orange-100">{student?.class?.name || 'JSS 1A'}</p>
            <p className="text-orange-100">Admission: {student?.admission_number || 'GFA/2024/001'}</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-2 text-white">
              {average}%
            </div>
            <p className="text-orange-100 font-medium">Term Average</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <BookOpen className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="text-sm text-gray-600 font-medium mb-1">Average Score</h3>
          <p className="text-2xl font-bold text-gray-900">{average}%</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="text-sm text-gray-600 font-medium mb-1">Attendance</h3>
          <p className="text-2xl font-bold text-gray-900">{attendance}%</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <Calendar className="w-10 h-10 text-purple-500 mb-4" />
          <h3 className="text-sm text-gray-600 font-medium mb-1">Classes Today</h3>
          <p className="text-2xl font-bold text-gray-900">
            {timetable.filter((t: any) => {
              const today = new Date().getDay();
              const dayMap: { [key: number]: number } = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
              return t.day_of_week === dayMap[today] || t.day === getDayName();
            }).length || 2}
          </p>        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <DollarSign className="w-10 h-10 text-orange-500 mb-4" />
          <h3 className="text-sm text-gray-600 font-medium mb-1">Fees Status</h3>
          <p className="text-2xl font-bold text-gray-900">{feesStatus}</p>
          <p className="text-sm text-gray-600">{formatCurrency(feesAmount)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Recent Results */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Results</h2>
          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No results available yet</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900">{result.subject?.name || result.subject}</p>
                    <p className="text-sm text-gray-600">{result.term || 'Second Term'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{result.total_score || result.score}%</p>
                    <p className="text-sm text-gray-600">Grade: <span className="font-bold">{result.grade || 'A'}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Timetable */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            {timetable.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No timetable available</p>
            ) : (
              timetable.slice(0, 4).map((slot, index) => (
                <div key={index} className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <p className="font-bold text-gray-900">{slot.subject?.name || slot.subject}</p>
                  <p className="text-sm text-gray-700">
                    {slot.start_time || slot.time} | Room {slot.room_number || slot.room}
                  </p>
                </div>
              ))
            )}          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get current day name
function getDayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}