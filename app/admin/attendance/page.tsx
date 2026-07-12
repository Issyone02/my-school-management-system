'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Download, Search, Save, CheckCircle, XCircle, Clock, AlertCircle, User, AlertTriangle, Lock } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import StudentAttendanceSummary from '@/components/StudentAttendanceSummary'

interface Student {
  id: string
  full_name: string
  admission_number: string
  class_id: string
}

interface AttendanceRecord {
  id?: string
  student_id: string
  class_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note?: string
  is_locked?: boolean
  locked_at?: string
  marked_by?: string
}

export default function AttendancePage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [selectedClass, setSelectedClass] = useState('jss1')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [summaryStudent, setSummaryStudent] = useState<any>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  const classOptions = [
    { id: 'jss1', name: 'JSS 1' }, { id: 'jss2', name: 'JSS 2' }, { id: 'jss3', name: 'JSS 3' },
    { id: 'ss1', name: 'SS 1' }, { id: 'ss2', name: 'SS 2' }, { id: 'ss3', name: 'SS 3' },
  ]

  const statusOptions: { value: 'present' | 'absent' | 'late' | 'excused'; label: string; icon: any; color: string }[] = [
    { value: 'present', label: 'Present', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'absent', label: 'Absent', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300' },
    { value: 'late', label: 'Late', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'excused', label: 'Excused', icon: AlertCircle, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  ]

  useEffect(() => {
    fetchData()
  }, [selectedClass, selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, admission_number, class_id')
        .eq('class_id', selectedClass)
        .order('full_name')

      if (studentsError) throw studentsError
      setStudents(studentsData || [])

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate)

      if (attendanceError) throw attendanceError

      const attendanceMap: Record<string, AttendanceRecord> = {}
      ;(attendanceData || []).forEach((a: any) => {
        attendanceMap[a.student_id] = a
      })
      setAttendance(attendanceMap)

    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        student_id: studentId,
        class_id: selectedClass,
        date: selectedDate,
        status,
        note: prev[studentId]?.note || '',
        is_locked: prev[studentId]?.is_locked || false
      }
    }))
  }

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }))
  }

  const saveAllAttendance = async () => {
    setSaving(true)
    try {
      const records = Object.values(attendance).filter(r => r.status && !r.is_locked)
      
      if (records.length === 0) {
        toast('No editable attendance records to save')
        setSaving(false)
        return
      }

      for (const record of records) {
        const { error } = await supabase.from('attendance').upsert({
          id: record.id,
          student_id: record.student_id,
          class_id: record.class_id,
          date: record.date,
          status: record.status,
          note: record.note || null,
          marked_by: 'admin',
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,date' })
        
        if (error) throw error
      }

      toast.success(`${records.length} attendance records saved!`)
      fetchData()
    } catch (error: any) {
      toast.error('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Admission No', 'Student Name', 'Status', 'Note', 'Date']
    const rows = students.map(s => {
      const record = attendance[s.id]
      return [
        s.admission_number,
        s.full_name,
        record?.status || 'Not Marked',
        record?.note || '',
        selectedDate
      ]
    })
    
    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${selectedClass}_${selectedDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Exported to CSV!')
  }

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter(s => attendance[s.id]?.status === 'present').length,
    absent: filteredStudents.filter(s => attendance[s.id]?.status === 'absent').length,
    late: filteredStudents.filter(s => attendance[s.id]?.status === 'late').length,
    excused: filteredStudents.filter(s => attendance[s.id]?.status === 'excused').length,
    notMarked: filteredStudents.filter(s => !attendance[s.id]?.status).length,
  }
  stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  if (loading) {
    return <div className="p-8 text-gray-900 font-bold">Loading attendance...</div>
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Mark daily attendance for your classes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700">
            <Download size={18}/> Export CSV
          </button>
          <button 
            onClick={saveAllAttendance} 
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={18}/> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Lock Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle size={20}/>
          <div>
            <p className="font-bold">Attendance Lock Policy</p>
            <p className="text-sm">Attendance records are automatically locked after 24 hours to prevent unauthorized changes. Contact admin to unlock if correction is needed.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="p-2 border rounded text-gray-900 min-w-[120px]"
            >
              {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border rounded text-gray-900"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input 
                type="text" 
                placeholder="Search by name or admission..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow text-center border border-green-200">
          <p className="text-sm text-green-700">Present</p>
          <p className="text-2xl font-bold text-green-900">{stats.present}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow text-center border border-red-200">
          <p className="text-sm text-red-700">Absent</p>
          <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow text-center border border-yellow-200">
          <p className="text-sm text-yellow-700">Late</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow text-center border border-blue-200">
          <p className="text-sm text-blue-700">Excused</p>
          <p className="text-2xl font-bold text-blue-900">{stats.excused}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow text-center border border-purple-200">
          <p className="text-sm text-purple-700">Attendance</p>
          <p className="text-2xl font-bold text-purple-900">{stats.percentage}%</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-gray-900 font-bold">Admission No</th>
                <th className="text-gray-900 font-bold">Student Name</th>
                <th className="text-gray-900 font-bold text-center">Status</th>
                <th className="text-gray-900 font-bold text-center">Actions</th>
                <th className="text-gray-900 font-bold">Note (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-600">
                    <User size={48} className="mx-auto text-gray-300 mb-2"/>
                    <p className="font-bold">No students found</p>
                    <p className="text-sm">Add students to this class first</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const record = attendance[student.id]
                  const isLocked = record?.is_locked || false
                  return (
                    <tr key={student.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-gray-900 font-medium">{student.admission_number}</td>
                      <td className="text-gray-900">{student.full_name}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {statusOptions.map(option => {
                            const Icon = option.icon
                            const isActive = record?.status === option.value
                            return (
                              <button
                                key={option.value}
                                onClick={() => handleStatusChange(student.id, option.value)}
                                disabled={isLocked}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                                  isActive 
                                    ? `${option.color} ring-2 ring-offset-1 ring-gray-400` 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={isLocked ? 'Locked - Cannot edit' : option.label}
                              >
                                <Icon size={14}/>
                                <span className="hidden sm:inline">{option.label}</span>
                                {isLocked && isActive && (
                                  <Lock size={10} className="ml-1"/>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSummaryStudent(student)
                            setIsSummaryOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold text-sm border border-blue-600 px-3 py-1 rounded hover:bg-blue-50"
                        >
                          View Summary
                        </button>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={record?.note || ''}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          disabled={isLocked}
                          placeholder={isLocked ? 'Locked - Cannot edit' : 'Reason for absence/late...'}
                          className={`w-full p-2 border rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 ${
                            isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-600"/> Present</span>
        <span className="flex items-center gap-1"><XCircle size={16} className="text-red-600"/> Absent</span>
        <span className="flex items-center gap-1"><Clock size={16} className="text-yellow-600"/> Late</span>
        <span className="flex items-center gap-1"><AlertCircle size={16} className="text-blue-600"/> Excused</span>
        <span className="flex items-center gap-1"><Lock size={16} className="text-gray-600"/> Locked (Cannot Edit)</span>
      </div>

      {/* Student Attendance Summary Modal */}
      <StudentAttendanceSummary 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        student={summaryStudent}
      />
    </div>
  )
}``