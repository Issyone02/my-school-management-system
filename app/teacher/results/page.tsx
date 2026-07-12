'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Eye, Edit, Trash2, X, ChevronDown, ChevronRight, Printer } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { auditActions } from '@/lib/auditLog'

interface Subject {
  id: string
  name: string
  code: string
  class_id: string
}

export default function TeacherResultsPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  
  const [activeTab, setActiveTab] = useState<'enter' | 'view'>('enter')
  const [students, setStudents] = useState<any[]>([])
  const [results, setResults] = useState<Record<string, any>>({})
  const [savedResults, setSavedResults] = useState<any[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedClass, setSelectedClass] = useState('ss1')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedSubjectName, setSelectedSubjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingResult, setEditingResult] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const classes = ['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3']
  const termOptions = ['First Term', 'Second Term', 'Third Term']
  const sessionOptions = ['2023/2024', '2024/2025', '2025/2026', '2026/2027']
  const [selectedTerm, setSelectedTerm] = useState('First Term')
  const [selectedSession, setSelectedSession] = useState('2024/2025')

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, code, class_id')
        .eq('class_id', selectedClass)
        .eq('active', true)
        .order('name')

      if (error) return
      
      setSubjects(data || [])
      
      if (data && data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].id)
        setSelectedSubjectName(data[0].name)
      }
    } catch (error) {
      console.error('Failed to load subjects:', error)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchSubjects()
    }
  }, [isLoaded, user, selectedClass])

  useEffect(() => {
    if (isLoaded && user && selectedClass && selectedSubjectId) {
      fetchStudents()
    }
  }, [isLoaded, user, selectedClass, selectedSubjectId])

  useEffect(() => {
    if (activeTab === 'view') {
      fetchSavedResults()
    }
  }, [activeTab, selectedClass, selectedTerm, selectedSession])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, admission_number, class_id')
        .eq('class_id', selectedClass)
        .order('full_name')

      if (error) throw error
      
      setStudents(data || [])
      
      if (data && data.length > 0 && selectedSubjectId) {
        const { data: existingResults } = await supabase
          .from('results')
          .select('*')
          .eq('class_id', selectedClass)
          .eq('subject_id', selectedSubjectId)
          .eq('term', selectedTerm)
          .eq('session', selectedSession)
        
        const resultsMap: Record<string, any> = {}
        ;(existingResults || []).forEach((r: any) => {
          resultsMap[r.student_id] = r
        })
        setResults(resultsMap)
      }
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedResults = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          student:students(full_name, admission_number),
          subject:subjects(name)
        `)
        .eq('class_id', selectedClass)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
        .eq('marked_by', 'teacher')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const enriched = (data || []).map((r: any) => ({
        ...r,
        student_name: r.student?.full_name || 'Unknown',
        admission_number: r.student?.admission_number || 'N/A',
        subject_name: r.subject?.name || 'Unknown'
      }))
      
      setSavedResults(enriched)
    } catch (error: any) {
      toast.error('Failed to load results: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (studentId: string, field: string, value: number) => {
    setResults(prev => {
      const existing = prev[studentId] || {}
      const ca = field === 'ca' ? value : (existing.ca_score || 0)
      const exam = field === 'exam' ? value : (existing.exam_score || 0)
      const total = ca + exam
      
      let grade = 'F9', remark = 'Fail'
      if (total >= 75) { grade = 'A1'; remark = 'Excellent' }
      else if (total >= 70) { grade = 'B2'; remark = 'Very Good' }
      else if (total >= 65) { grade = 'B3'; remark = 'Good' }
      else if (total >= 60) { grade = 'C4'; remark = 'Credit' }
      else if (total >= 55) { grade = 'C5'; remark = 'Credit' }
      else if (total >= 50) { grade = 'C6'; remark = 'Credit' }
      else if (total >= 45) { grade = 'D7'; remark = 'Pass' }
      else if (total >= 40) { grade = 'E8'; remark = 'Pass' }

      return {
        ...prev,
        [studentId]: {
          ...existing,
          student_id: studentId,
          subject_id: selectedSubjectId,
          class_id: selectedClass,
          ca_score: ca,
          exam_score: exam,
          total_score: total,
          grade,
          remark,
          term: selectedTerm,
          session: selectedSession
        }
      }
    })
  }

  const saveAllResults = async () => {
    setSaving(true)
    try {
      const records = Object.values(results).filter(r => r.ca_score !== undefined || r.exam_score !== undefined)
      
      if (records.length === 0) {
        toast.error('No results to save - enter scores first')
        setSaving(false)
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const record of records) {
        const { error } = await supabase.from('results').upsert({
          id: record.id,
          student_id: record.student_id,
          subject_id: selectedSubjectId,
          class_id: record.class_id,
          ca_score: record.ca_score,
          exam_score: record.exam_score,
          total_score: record.total_score,
          grade: record.grade,
          remark: record.remark,
          term: record.term,
          session: record.session,
          marked_by: 'teacher',
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,subject_id,term,session' })

        if (error) errorCount++
        else successCount++
      }

      if (errorCount > 0) {
        toast.error(`${successCount} saved, ${errorCount} failed`)
      } else {
        toast.success(`${successCount} results saved successfully!`)
        
        // ✅ AUDIT LOG: Teacher entered results
        const email = user?.emailAddresses[0]?.emailAddress || ''
        await auditActions.teacherEnterResults(email, selectedClass, selectedSubjectName, successCount)
      }
      
      fetchStudents()
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditResult = (result: any) => {
    setEditingResult({
      id: result.id,
      student_id: result.student_id,
      subject_id: result.subject_id,
      ca_score: result.ca_score,
      exam_score: result.exam_score
    })
    setShowEditModal(true)
  }

  const handleUpdateResult = async () => {
    if (!editingResult) return
    
    const ca = parseFloat(editingResult.ca_score) || 0
    const exam = parseFloat(editingResult.exam_score) || 0
    const total = ca + exam
    
    let grade = 'F9', remark = 'Fail'
    if (total >= 75) { grade = 'A1'; remark = 'Excellent' }
    else if (total >= 70) { grade = 'B2'; remark = 'Very Good' }
    else if (total >= 65) { grade = 'B3'; remark = 'Good' }
    else if (total >= 60) { grade = 'C4'; remark = 'Credit' }
    else if (total >= 55) { grade = 'C5'; remark = 'Credit' }
    else if (total >= 50) { grade = 'C6'; remark = 'Credit' }
    else if (total >= 45) { grade = 'D7'; remark = 'Pass' }
    else if (total >= 40) { grade = 'E8'; remark = 'Pass' }

    try {
      const { error } = await supabase.from('results').update({
        ca_score: ca,
        exam_score: exam,
        total_score: total,
        grade,
        remark,
        updated_at: new Date().toISOString()
      }).eq('id', editingResult.id)

      if (error) throw error

      toast.success('Result updated!')
      
      // ✅ AUDIT LOG: Teacher updated result
      const email = user?.emailAddresses[0]?.emailAddress || ''
      await auditActions.teacherUpdateResult(email, editingResult.student_id, selectedSubjectName)
      
      setShowEditModal(false)
      setEditingResult(null)
      fetchSavedResults()
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    }
  }

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Delete this result?')) return
    
    try {
      const { error } = await supabase.from('results').delete().eq('id', id)
      if (error) throw error
      
      toast.success('Result deleted!')
      
      // ✅ AUDIT LOG: Teacher deleted result
      const email = user?.emailAddresses[0]?.emailAddress || ''
      await auditActions.teacherDeleteResult(email, id)
      
      fetchSavedResults()
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    }
  }

  const handlePrint = (studentId: string, studentName: string, studentResults: any[]) => {
    if (studentResults.length === 0) {
      toast.error('No results to print')
      return
    }
    
    let rowsHtml = ''
    studentResults.forEach(r => {
      rowsHtml += `<tr>
        <td>${r.subject_name}</td>
        <td>${r.ca_score}</td>
        <td>${r.exam_score}</td>
        <td style="font-weight:bold">${r.total_score}</td>
        <td>${r.grade}</td>
        <td>${r.remark}</td>
      </tr>`
    })
    
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return
    
    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${studentName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
          h2, h3 { text-align: center; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h2>Greenfield Academy</h2>
        <h3>Report Card</h3>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Class:</strong> ${selectedClass.toUpperCase()} | <strong>Term:</strong> ${selectedTerm} | <strong>Session:</strong> ${selectedSession}</p>
        <table>
          <thead>
            <tr>
              <th>Subject</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remark</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload=function(){window.print();window.close()}</script>
      </body>
      </html>`
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  if (!isLoaded || loading) {
    return <div className="p-8 text-gray-900">Loading...</div>
  }

  // Group results by student for View tab
  const getStudentResults = (studentId: string) => {
    return savedResults.filter(r => r.student_id === studentId)
  }

  const uniqueStudents = Array.from(
    new Map(savedResults.map(r => [r.student_id, {
      id: r.student_id,
      name: r.student_name,
      admission: r.admission_number
    }])).values()
  )

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-gray-700 hover:text-gray-900">
        <ArrowLeft size={20}/> Back to Dashboard
      </button>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Results Management</h1>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('enter')}
            className={`px-6 py-3 font-bold ${
              activeTab === 'enter' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Save size={18} className="inline mr-2"/>
            Enter Results
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 font-bold ${
              activeTab === 'view' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Eye size={18} className="inline mr-2"/>
            View Results
          </button>
        </div>

        <div className="p-4">
          {/* Filters */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select 
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setSelectedSubjectId('')
                  setSelectedSubjectName('')
                  setExpandedStudent(null)
                }}
                className="p-2 border rounded text-gray-900 bg-white"
              >
                {classes.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            
            {activeTab === 'enter' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select 
                  value={selectedSubjectId}
                  onChange={(e) => {
                    const subject = subjects.find(s => s.id === e.target.value)
                    setSelectedSubjectId(e.target.value)
                    setSelectedSubjectName(subject?.name || '')
                  }}
                  className="p-2 border rounded text-gray-900 bg-white"
                  disabled={subjects.length === 0}
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects for this class</option>
                  ) : (
                    subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))
                  )}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select 
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="p-2 border rounded text-gray-900 bg-white"
              >
                {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <select 
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="p-2 border rounded text-gray-900 bg-white"
              >
                {sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Enter Results Tab */}
          {activeTab === 'enter' && (
            <div>
              <div className="flex justify-end mb-4">
                <button 
                  onClick={saveAllResults}
                  disabled={saving || subjects.length === 0 || !selectedSubjectId}
                  className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16}/>
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="p-4 text-left font-bold text-gray-900">Student Name</th>
                        <th className="p-4 text-center font-bold text-gray-900">CA (40)</th>
                        <th className="p-4 text-center font-bold text-gray-900">Exam (60)</th>
                        <th className="p-4 text-center font-bold text-gray-900">Total</th>
                        <th className="p-4 text-center font-bold text-gray-900">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map(student => {
                        const r = results[student.id] || {}
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="p-4 text-gray-900 font-medium">
                              <div>
                                <p className="font-bold text-gray-900">{student.full_name}</p>
                                <p className="text-sm text-gray-500">{student.admission_number}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="0"
                                max="40"
                                value={r.ca_score || ''}
                                onChange={(e) => handleScoreChange(student.id, 'ca', parseInt(e.target.value) || 0)}
                                className="w-full max-w-[100px] mx-auto block p-3 border-2 border-gray-300 rounded-lg text-center text-gray-900 font-bold bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                placeholder="0-40"
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="0"
                                max="60"
                                value={r.exam_score || ''}
                                onChange={(e) => handleScoreChange(student.id, 'exam', parseInt(e.target.value) || 0)}
                                className="w-full max-w-[100px] mx-auto block p-3 border-2 border-gray-300 rounded-lg text-center text-gray-900 font-bold bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                placeholder="0-60"
                              />
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 rounded-lg font-bold text-lg">
                                {r.total_score || 0}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                                r.grade === 'A1' ? 'bg-green-500 text-white' :
                                r.grade === 'B2' || r.grade === 'B3' ? 'bg-blue-500 text-white' :
                                r.grade === 'C4' || r.grade === 'C5' || r.grade === 'C6' ? 'bg-yellow-500 text-white' :
                                r.grade === 'D7' || r.grade === 'E8' ? 'bg-orange-500 text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {r.grade || '-'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                {students.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p className="font-bold">No students found in {selectedClass.toUpperCase()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View Results Tab - EXPANDABLE STUDENT ROWS */}
          {activeTab === 'view' && (
            <div>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">{uniqueStudents.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Total Results</p>
                  <p className="text-2xl font-bold text-green-900">{savedResults.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Avg Score</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {savedResults.length > 0 
                      ? (savedResults.reduce((sum, r) => sum + r.total_score, 0) / savedResults.length).toFixed(1)
                      : '0'
                    }
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-medium">Subjects</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {new Set(savedResults.map(r => r.subject_id)).size}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="p-3 text-left text-gray-900 font-bold w-8"></th>
                      <th className="p-3 text-left text-gray-900 font-bold">Admission No</th>
                      <th className="p-3 text-left text-gray-900 font-bold">Student Name</th>
                      <th className="p-3 text-center text-gray-900 font-bold">Total Subjects</th>
                      <th className="p-3 text-center text-gray-900 font-bold">Average</th>
                      <th className="p-3 text-center text-gray-900 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-600">
                          <Eye size={48} className="mx-auto text-gray-300 mb-2"/>
                          <p className="font-bold">No results found</p>
                          <p className="text-sm">Enter results using the "Enter Results" tab</p>
                        </td>
                      </tr>
                    ) : (
                      uniqueStudents.map(student => {
                        const studentResults = getStudentResults(student.id)
                        const average = studentResults.reduce((sum, r) => sum + r.total_score, 0) / studentResults.length
                        const isExpanded = expandedStudent === student.id
                        
                        return (
                          <>
                            {/* Main Student Row */}
                            <tr 
                              key={student.id}
                              className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                            >
                              <td className="p-3 text-gray-600">
                                {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                              </td>
                              <td className="p-3 text-gray-900 font-medium">{student.admission}</td>
                              <td className="p-3 text-gray-900 font-bold">{student.name}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-bold text-sm">
                                  {studentResults.length}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-3 py-1 rounded font-bold ${
                                  average >= 70 ? 'bg-green-100 text-green-800' :
                                  average >= 50 ? 'bg-blue-100 text-blue-800' :
                                  average >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {average.toFixed(1)}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                  <button 
                                    onClick={() => handlePrint(student.id, student.name, studentResults)}
                                    className="text-purple-600 hover:text-purple-800"
                                    title="Print Report Card"
                                  >
                                    <Printer size={16}/>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Row - All Subjects */}
                            {isExpanded && (
                              <tr key={`${student.id}-expanded`} className="bg-gray-50">
                                <td colSpan={6} className="p-0">
                                  <div className="p-4 border-t-2 border-gray-200">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                      <span className="text-blue-600">📚</span>
                                      {student.name} - All Subjects ({studentResults.length})
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm bg-white rounded-lg">
                                        <thead className="bg-gray-100">
                                          <tr>
                                            <th className="p-2 text-left text-gray-900 font-bold">Subject</th>
                                            <th className="p-2 text-center text-gray-900 font-bold">CA (40)</th>
                                            <th className="p-2 text-center text-gray-900 font-bold">Exam (60)</th>
                                            <th className="p-2 text-center text-gray-900 font-bold">Total</th>
                                            <th className="p-2 text-center text-gray-900 font-bold">Grade</th>
                                            <th className="p-2 text-left text-gray-900 font-bold">Remark</th>
                                            <th className="p-2 text-center text-gray-900 font-bold">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {studentResults.map(result => (
                                            <tr key={result.id} className="border-t hover:bg-gray-50">
                                              <td className="p-2 text-gray-900 font-medium">{result.subject_name}</td>
                                              <td className="p-2 text-center text-gray-900">{result.ca_score}</td>
                                              <td className="p-2 text-center text-gray-900">{result.exam_score}</td>
                                              <td className="p-2 text-center">
                                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-900 rounded font-bold">
                                                  {result.total_score}
                                                </span>
                                              </td>
                                              <td className="p-2 text-center">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                                  result.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                                                  result.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                                  result.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                                                  result.grade.startsWith('D') || result.grade.startsWith('E') ? 'bg-orange-100 text-orange-800' :
                                                  'bg-red-100 text-red-800'
                                                }`}>
                                                  {result.grade}
                                                </span>
                                              </td>
                                              <td className="p-2 text-gray-700">{result.remark}</td>
                                              <td className="p-2 text-center">
                                                <div className="flex justify-center gap-2">
                                                  <button 
                                                    onClick={() => handleEditResult(result)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                  >
                                                    <Edit size={14}/>
                                                  </button>
                                                  <button 
                                                    onClick={() => handleDeleteResult(result.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                  >
                                                    <Trash2 size={14}/>
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Result</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-700 hover:text-gray-900">
                <X size={24}/>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CA Score (0-40)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={editingResult.ca_score}
                  onChange={(e) => setEditingResult({...editingResult, ca_score: e.target.value})}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Score (0-60)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={editingResult.exam_score}
                  onChange={(e) => setEditingResult({...editingResult, exam_score: e.target.value})}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <button
                onClick={handleUpdateResult}
                className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700"
              >
                Update Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}