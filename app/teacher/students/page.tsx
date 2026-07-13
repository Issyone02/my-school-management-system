'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Mail, Phone, GraduationCap } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Student {
  id: string
  full_name: string
  admission_number: string
  class_id: string
  email?: string
  phone?: string
  gender?: string
  date_of_birth?: string
}

interface Assignment {
  id: string
  class_id: string
  subject_name: string
}

export default function TeacherStudentsPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchTeacherData()
    }
  }, [user, isLoaded])

  useEffect(() => {
    if (assignments.length > 0) {
      fetchStudents()
    }
  }, [selectedClass, searchTerm, assignments])

  const fetchTeacherData = async () => {
    try {
      const email = user?.emailAddresses[0]?.emailAddress
      if (!email) return

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', email)
        .single()

      if (!teacher) return

      const { data: assignmentsData } = await supabase
        .from('teacher_assignments')
        .select('class_id, subject_name')
        .eq('teacher_id', teacher.id)
        .eq('is_active', true)

      setAssignments((assignmentsData || []) as any)
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('students')
        .select('*')
        .eq('active', true)
        .order('full_name')

      if (selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass)
      }

      // Filter by assigned classes only
      const assignedClasses = [...new Set(assignments.map(a => a.class_id))]
      query = query.in('class_id', assignedClasses)

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,admission_number.ilike.%${searchTerm}%`)
      }

      const { data: studentsData, error } = await query

      if (error) throw error
      setStudents(studentsData || [])
    } catch (error: any) {
      toast.error('Failed to load students: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getUniqueClasses = () => {
    return [...new Set(assignments.map(a => a.class_id))]
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={20}/> Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Students 👨‍</h1>
          <p className="text-gray-600">View and manage students in your classes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="p-2 border rounded text-gray-900 bg-white"
            >
              <option value="all">All Classes</option>
              {getUniqueClasses().map(classId => (
                <option key={classId} value={classId}>
                  {classId.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User size={20} className="text-blue-600"/>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <GraduationCap size={20} className="text-green-600"/>
              </div>
              <div>
                <p className="text-sm text-gray-600">Classes</p>
                <p className="text-2xl font-bold text-gray-900">{getUniqueClasses().length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Mail size={20} className="text-purple-600"/>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Students List</h2>
          </div>
          
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <User size={48} className="mx-auto text-gray-300 mb-2"/>
              <p className="font-bold">No students found</p>
              <p className="text-sm">No students in your assigned classes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-gray-900 font-bold">Admission No</th>
                    <th className="text-gray-900 font-bold">Student Name</th>
                    <th className="text-gray-900 font-bold">Class</th>
                    <th className="text-gray-900 font-bold">Gender</th>
                    <th className="text-gray-900 font-bold">Date of Birth</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-900 font-medium">{student.admission_number}</td>
                      <td className="p-3 text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User size={16} className="text-blue-600"/>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{student.full_name}</p>
                            {student.email && (
                              <p className="text-sm text-gray-500">{student.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                          {student.class_id.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 capitalize">{student.gender || 'N/A'}</td>
                      <td className="p-3 text-gray-700">
                        {student.date_of_birth 
                          ? new Date(student.date_of_birth).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}