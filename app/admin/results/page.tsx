'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, FileText, Download, Printer, Edit, Trash2, X, Upload } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Subject {
  id: string
  name: string
  code: string
  class_id: string
  term: string
  session: string
  active: boolean
}

interface Result {
  id: string
  student_id: string
  student_name: string
  admission_number: string
  subject_id: string
  subject_name: string
  class_id: string
  term: string
  session: string
  ca_score: number
  exam_score: number
  total_score: number
  grade: string
  remark: string
}

interface Student {
  id: string
  full_name: string
  admission_number: string
  class_id: string
}

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<'bulk-results' | 'view' | 'subjects' | 'bulk-subjects'>('bulk-results')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'subject' | 'result'>('subject')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('jss1')
  const [selectedTerm, setSelectedTerm] = useState('First Term')
  const [selectedSession, setSelectedSession] = useState('2024/2025')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)

  const classOptions = [
    { id: 'jss1', name: 'JSS 1' }, { id: 'jss2', name: 'JSS 2' }, { id: 'jss3', name: 'JSS 3' },
    { id: 'ss1', name: 'SS 1' }, { id: 'ss2', name: 'SS 2' }, { id: 'ss3', name: 'SS 3' },
  ]
  const termOptions = ['First Term', 'Second Term', 'Third Term']
  const sessionOptions = ['2023/2024', '2024/2025', '2025/2026', '2026/2027']

  const gradingSystem = [
    { grade: 'A1', min: 75, max: 100, remark: 'Excellent' },
    { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
    { grade: 'B3', min: 65, max: 69, remark: 'Good' },
    { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
    { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
    { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
    { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
    { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
    { grade: 'F9', min: 0, max: 39, remark: 'Fail' },
  ]

  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', class_id: 'jss1', term: 'First Term', session: '2024/2025', active: true })
  const [resultForm, setResultForm] = useState({ student_id: '', subject_id: '', ca_score: '', exam_score: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    await Promise.all([fetchSubjects(), fetchResults(), fetchStudents()])
    setLoading(false)
  }

  const fetchSubjects = async () => {
    const { data, error } = await supabase.from('subjects').select('*').order('name')
    if (error) toast.error('Failed: ' + error.message)
    else setSubjects(data || [])
  }

  const fetchResults = async () => {
    const { data, error } = await supabase.from('results').select(`*, student:students(full_name, admission_number), subject:subjects(name)`).order('created_at', { ascending: false })
    if (error) toast.error('Failed: ' + error.message)
    else {
      const enriched = (data || []).map((r: any) => ({
        ...r,
        student_name: r.student?.full_name || 'Unknown',
        admission_number: r.student?.admission_number || 'N/A',
        subject_name: r.subject?.name || 'Unknown',
      }))
      setResults(enriched)
    }
  }

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, full_name, admission_number, class_id').order('full_name')
    setStudents(data || [])
  }

  const getGrade = (total: number) => {
    const g = gradingSystem.find(g => total >= g.min && total <= g.max)
    return { grade: g?.grade || 'F9', remark: g?.remark || 'Fail' }
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...subjectForm }
      if (editingItem) {
        await supabase.from('subjects').update(payload).eq('id', editingItem.id)
        toast.success('Subject updated!')
      } else {
        await supabase.from('subjects').insert([payload])
        toast.success('Subject added!')
      }
      setShowModal(false)
      setSubjectForm({ name: '', code: '', class_id: 'jss1', term: 'First Term', session: '2024/2025', active: true })
      setEditingItem(null)
      fetchSubjects()
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    }
  }

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const ca = parseFloat(resultForm.ca_score) || 0
      const exam = parseFloat(resultForm.exam_score) || 0
      const total = ca + exam
      const { grade, remark } = getGrade(total)
      
      const payload = {
        student_id: resultForm.student_id,
        subject_id: resultForm.subject_id,
        class_id: selectedClass,
        term: selectedTerm,
        session: selectedSession,
        ca_score: ca,
        exam_score: exam,
        total_score: total,
        grade,
        remark,
        marked_by: 'admin'
      }
      
      if (editingItem) {
        await supabase.from('results').update(payload).eq('id', editingItem.id)
        toast.success('Result updated!')
      } else {
        await supabase.from('results').insert([payload])
        toast.success('Result entered!')
      }
      setShowModal(false)
      setResultForm({ student_id: '', subject_id: '', ca_score: '', exam_score: '' })
      setEditingItem(null)
      fetchResults()
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('subjects').delete().eq('id', id)
    toast.success('Deleted!')
    fetchSubjects()
  }

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('results').delete().eq('id', id)
    toast.success('Deleted!')
    fetchResults()
  }

  const handlePrint = (studentId?: string) => {
    if (!studentId) return
    
    const student = students.find(s => s.id === studentId)
    if (!student) return
    
    const studentResults = results.filter(r => 
      r.student_id === studentId && 
      r.term === selectedTerm && 
      r.session === selectedSession
    )
    
    if (studentResults.length === 0) {
      toast.error('No results found for this student')
      return
    }
    
    let rowsHtml = ''
    studentResults.forEach(r => {
      rowsHtml += '<tr>'
      rowsHtml += '<td>' + r.subject_name + '</td>'
      rowsHtml += '<td>' + r.ca_score + '</td>'
      rowsHtml += '<td>' + r.exam_score + '</td>'
      rowsHtml += '<td style="color:#22c55e;font-weight:bold">' + r.total_score + '</td>'
      rowsHtml += '<td>' + r.grade + '</td>'
      rowsHtml += '<td>' + r.remark + '</td>'
      rowsHtml += '</tr>'
    })
    
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) { window.print(); return }
    
    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${student.full_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #000; background: #fff; }
          h2, h3 { text-align: center; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h2>Greenfield Academy</h2>
        <h3>Report Card</h3>
        <p><strong>Student:</strong> ${student.full_name}</p>
        <p><strong>Admission:</strong> ${student.admission_number}</p>
        <p><strong>Class:</strong> ${selectedClass} | <strong>Term:</strong> ${selectedTerm} | <strong>Session:</strong> ${selectedSession}</p>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>CA</th>
              <th>Exam</th>
              <th>Total</th>
              <th>Grade</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>window.onload=function(){window.print();window.close()}</script>
      </body>
      </html>`
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const filteredResults = results.filter(r => 
    r.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const downloadSubjectTemplate = () => {
    const csv = 'Subject Name,Subject Code,Class,Term,Session,Active\nEnglish Language,ENG01,JSS 1,First Term,2024/2025,true\nMathematics,MTH01,JSS 1,First Term,2024/2025,true\nBasic Science,SCI01,JSS 1,First Term,2024/2025,true'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subjects_template.csv'
    a.click()
    toast.success('Template downloaded!')
  }

  const handleBulkSubjectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split('\n').slice(1)
        const subjects = lines.map(line => {
          const [name, code, class_id, term, session, active] = line.split(',')
          return {
            name: name?.trim(),
            code: code?.trim(),
            class_id: class_id?.trim(),
            term: term?.trim(),
            session: session?.trim(),
            active: active?.trim() === 'true'
          }
        }).filter(s => s.name && s.code)
        
        if (subjects.length === 0) {
          toast.error('No valid subjects')
          return
        }
        
        const { error } = await supabase.from('subjects').insert(subjects)
        if (error) throw error
        
        toast.success(`${subjects.length} subjects added!`)
        fetchSubjects()
      } catch (error: any) {
        toast.error('Failed: ' + error.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const getStudentResults = (studentId: string) => {
    return results.filter(r => 
      r.student_id === studentId && 
      r.class_id === selectedClass &&
      r.term === selectedTerm &&
      r.session === selectedSession
    )
  }

  const downloadResultTemplate = () => {
    const csv = 'Admission Number,Subject Code,CA Score,Exam Score\nGFA/2024/001,ENG01,30,55\nGFA/2024/001,MTH01,28,50\nGFA/2024/001,SCI01,25,48'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'results_template.csv'
    a.click()
    toast.success('Template downloaded!')
  }

  const handleBulkResultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split('\n').filter(line => line.trim())
        let saved = 0
        let updated = 0
        let failed = 0
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          
          if (i === 0 && line.toLowerCase().includes('admission')) {
            continue
          }
          
          const parts = line.split(',').map(p => p.trim())
          const [admissionNumber, subjectCode, caScore, examScore] = parts
          
          if (!admissionNumber || !subjectCode) {
            failed++
            continue
          }
          
          const student = students.find(s => 
            s.admission_number.toLowerCase() === admissionNumber.toLowerCase()
          )
          if (!student) {
            failed++
            continue
          }
          
          const normalizeClass = (cls: string) => cls.toLowerCase().replace(/[\s\-_]/g, '')
          
          const subject = subjects.find(s => {
            const codeMatch = s.code.toLowerCase() === subjectCode.toLowerCase()
            const classMatch = normalizeClass(s.class_id) === normalizeClass(selectedClass)
            return codeMatch && classMatch
          })
          
          if (!subject) {
            failed++
            continue
          }
          
          const ca = parseFloat(caScore) || 0
          const exam = parseFloat(examScore) || 0
          const total = ca + exam
          const { grade, remark } = getGrade(total)
          
          const payload = {
            student_id: student.id,
            subject_id: subject.id,
            class_id: selectedClass,
            term: selectedTerm,
            session: selectedSession,
            ca_score: ca,
            exam_score: exam,
            total_score: total,
            grade,
            remark,
            marked_by: 'admin'
          }
          
          const { data, error } = await supabase.from('results').insert([payload]).select()
          
          if (error) {
            if (error.code === '23505' || error.message.includes('duplicate')) {
              const { error: updateError } = await supabase.from('results')
                .update({ 
                  ca_score: ca, 
                  exam_score: exam, 
                  total_score: total, 
                  grade, 
                  remark,
                  updated_at: new Date().toISOString()
                })
                .eq('student_id', student.id)
                .eq('subject_id', subject.id)
                .eq('term', selectedTerm)
                .eq('session', selectedSession)
              
              if (updateError) {
                failed++
              } else {
                updated++
                saved++
              }
            } else {
              failed++
            }
          } else {
            saved++
          }
        }
        
        toast.success(`Saved: ${saved}, Updated: ${updated}, Failed: ${failed}`)
        await fetchResults()
        setTimeout(() => {
          setActiveTab('view')
        }, 1000)
        
      } catch (error: any) {
        toast.error('Failed: ' + error.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-8 text-gray-900 font-bold">Loading...</div>

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-700">Bulk entry for thousands of students</p>
        </div>
        <div className="flex gap-3">
          {/* ✅ NEW: Single Entry Button */}
          <button 
            onClick={() => { 
              setModalType('result')
              setEditingItem(null)
              setResultForm({ student_id: '', subject_id: '', ca_score: '', exam_score: '' })
              setShowModal(true)
            }} 
            className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-700"
          >
            <FileText size={18}/>Single Entry
          </button>
          
          {/* Existing: Add Subject Button */}
          <button onClick={() => { setModalType('subject'); setEditingItem(null); setShowModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18}/>Add Subject
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow mb-6">
        <div className="flex border-b overflow-x-auto">
          <button onClick={() => setActiveTab('bulk-results')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'bulk-results' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>Bulk Results</button>
          <button onClick={() => setActiveTab('view')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'view' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>View Results</button>
          <button onClick={() => setActiveTab('subjects')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'subjects' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>Subjects</button>
          <button onClick={() => setActiveTab('bulk-subjects')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'bulk-subjects' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>Bulk Subjects</button>
        </div>

        <div className="p-4">
          <div className="flex gap-4 mb-4 flex-wrap">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-2 border rounded text-gray-900">
              {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="p-2 border rounded text-gray-900">
              {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="p-2 border rounded text-gray-900">
              {sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 p-2 border rounded text-gray-900" />
          </div>

          {activeTab === 'bulk-results' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-2">Bulk Result Entry - CSV Upload</h3>
                <p className="text-green-800 mb-4">Upload CSV to enter results for ALL students at once. Perfect for 1000+ students!</p>
                
                <div className="flex flex-wrap gap-4 items-center mb-4">
                  <button onClick={downloadResultTemplate} className="flex items-center space-x-2 bg-white border-2 border-green-300 text-green-700 px-4 py-2 rounded hover:bg-green-50 font-bold">
                    <Download size={16}/>Download Template
                  </button>
                  
                  <label className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold cursor-pointer">
                    <Upload size={16}/>
                    <span>Upload CSV File</span>
                    <input type="file" accept=".csv" onChange={handleBulkResultUpload} className="hidden"/>
                  </label>
                </div>
                
                <div className="bg-white p-4 rounded border border-green-200">
                  <p className="font-bold text-green-900 mb-2">CSV Format:</p>
                  <code className="text-sm bg-green-100 px-2 py-1 rounded block">Admission Number,Subject Code,CA Score,Exam Score</code>
                  <p className="text-sm text-green-700 mt-2">Example:</p>
                  <code className="text-xs bg-green-100 px-2 py-1 rounded block">GFA/2024/001,ENG01,30,55</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'view' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {new Set(filteredResults.map(r => r.student_id)).size}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Results</p>
                  <p className="text-2xl font-bold text-green-900">{filteredResults.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Avg Score</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {filteredResults.length > 0 
                      ? (filteredResults.reduce((sum, r) => sum + r.total_score, 0) / filteredResults.length).toFixed(1)
                      : '0'
                    }
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Subjects</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {new Set(filteredResults.map(r => r.subject_id)).size}
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 text-left text-gray-900 font-bold">Admission No</th>
                      <th className="text-gray-900 font-bold">Student Name</th>
                      <th className="text-gray-900 font-bold text-center">Total Subjects</th>
                      <th className="text-gray-900 font-bold text-center">Average</th>
                      <th className="text-gray-900 font-bold text-center">Position</th>
                      <th className="text-gray-900 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set(filteredResults.map(r => r.student_id))).map(studentId => {
                      const studentResults = getStudentResults(studentId)
                      const student = students.find(s => s.id === studentId)
                      const average = studentResults.reduce((sum, r) => sum + r.total_score, 0) / studentResults.length
                      
                      const isExpanded = expandedStudent === studentId
                      
                      return (
                        <tr key={studentId}>
                          <td colSpan={6}>
                            <div 
                              className="border-b hover:bg-gray-50 cursor-pointer transition-colors p-3 grid grid-cols-6 items-center"
                              onClick={() => setExpandedStudent(isExpanded ? null : studentId)}
                            >
                              <div className="text-gray-900 font-medium">{student?.admission_number}</div>
                              <div className="text-gray-900">{student?.full_name}</div>
                              <div className="text-center text-gray-900">{studentResults.length}</div>
                              <div className="text-center">
                                <span className={`px-2 py-1 rounded font-bold ${
                                  average >= 70 ? 'bg-green-100 text-green-800' :
                                  average >= 50 ? 'bg-blue-100 text-blue-800' :
                                  average >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {average.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-center text-gray-900 font-bold">-</div>
                              <div className="text-center">
                                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePrint(studentId)
                                    }}
                                    className="text-purple-600 hover:text-purple-800"
                                    title="Print Report Card"
                                  >
                                    <Printer size={16}/>
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const firstResult = studentResults[0]
                                      if (firstResult) {
                                        setEditingItem(firstResult)
                                        setResultForm({
                                          student_id: firstResult.student_id,
                                          subject_id: firstResult.subject_id,
                                          ca_score: firstResult.ca_score.toString(),
                                          exam_score: firstResult.exam_score.toString()
                                        })
                                        setModalType('result')
                                        setShowModal(true)
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit Result"
                                  >
                                    <Edit size={16}/>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="bg-gray-50 p-4 border-t">
                                <h4 className="font-bold text-gray-900 mb-3">
                                  {student?.full_name} - All Subjects ({studentResults.length})
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="p-2 text-left">Subject</th>
                                        <th className="text-center">CA (40)</th>
                                        <th className="text-center">Exam (60)</th>
                                        <th className="text-center">Total</th>
                                        <th className="text-center">Grade</th>
                                        <th className="text-center">Remark</th>
                                        <th className="text-center">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {studentResults.map(result => (
                                        <tr key={result.id} className="border-t hover:bg-white">
                                          <td className="p-2 text-gray-900 font-medium">{result.subject_name}</td>
                                          <td className="text-center text-gray-900">{result.ca_score}</td>
                                          <td className="text-center text-gray-900">{result.exam_score}</td>
                                          <td className="text-center font-bold text-gray-900">{result.total_score}</td>
                                          <td className="text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                              result.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                                              result.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                              result.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                                              result.grade.startsWith('D') || result.grade.startsWith('E') ? 'bg-orange-100 text-orange-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {result.grade}
                                            </span>
                                          </td>
                                          <td className="text-center text-gray-700">{result.remark}</td>
                                          <td className="text-center">
                                            <div className="flex justify-center gap-2">
                                              <button 
                                                onClick={() => {
                                                  setEditingItem(result)
                                                  setResultForm({
                                                    student_id: result.student_id,
                                                    subject_id: result.subject_id,
                                                    ca_score: result.ca_score.toString(),
                                                    exam_score: result.exam_score.toString()
                                                  })
                                                  setModalType('result')
                                                  setShowModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                              >
                                                <Edit size={14}/>
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteResult(result.id)}
                                                className="text-red-600 hover:text-red-800"
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
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                
                {filteredResults.length === 0 && (
                  <div className="p-8 text-center text-gray-600">
                    <FileText size={48} className="mx-auto text-gray-300 mb-2"/>
                    <p className="font-bold">No results found</p>
                    <p className="text-sm">Upload results using Bulk Results tab</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-gray-900 font-bold">Name</th>
                    <th className="text-gray-900 font-bold">Code</th>
                    <th className="text-gray-900 font-bold">Class</th>
                    <th className="text-gray-900 font-bold">Term</th>
                    <th className="text-gray-900 font-bold">Session</th>
                    <th className="text-gray-900 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-600">No subjects found</td></tr>
                  ) : (
                    filteredSubjects.map(s => (
                      <tr key={s.id} className="border-t hover:bg-gray-50">
                        <td className="p-2 text-gray-900">{s.name}</td>
                        <td className="text-gray-900">{s.code}</td>
                        <td className="text-gray-900">{s.class_id}</td>
                        <td className="text-gray-900">{s.term}</td>
                        <td className="text-gray-900">{s.session}</td>
                        <td>
                          <button onClick={() => { setEditingItem(s); setSubjectForm({ name: s.name, code: s.code, class_id: s.class_id, term: s.term, session: s.session, active: s.active }); setModalType('subject'); setShowModal(true) }} className="text-blue-600 hover:text-blue-800 mr-2"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteSubject(s.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'bulk-subjects' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Bulk Subject Entry</h3>
                <p className="text-blue-800 mb-4">Upload CSV to add multiple subjects at once.</p>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <button onClick={downloadSubjectTemplate} className="flex items-center space-x-2 bg-white border-2 border-blue-300 text-blue-700 px-4 py-2 rounded hover:bg-blue-50 font-bold">
                    <Download size={16}/>Download Template
                  </button>
                  
                  <label className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold cursor-pointer">
                    <Upload size={16}/>
                    <span>Upload CSV</span>
                    <input type="file" accept=".csv" onChange={handleBulkSubjectUpload} className="hidden"/>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && modalType === 'subject' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Subject' : 'Add Subject'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-700 hover:text-gray-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-3">
              <input placeholder="Subject Name" value={subjectForm.name} onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})} required className="w-full p-2 border rounded text-gray-900"/>
              <input placeholder="Subject Code" value={subjectForm.code} onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})} required className="w-full p-2 border rounded text-gray-900"/>
              <select value={subjectForm.class_id} onChange={(e) => setSubjectForm({...subjectForm, class_id: e.target.value})} className="w-full p-2 border rounded text-gray-900">
                {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={subjectForm.term} onChange={(e) => setSubjectForm({...subjectForm, term: e.target.value})} className="w-full p-2 border rounded text-gray-900">
                {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={subjectForm.session} onChange={(e) => setSubjectForm({...subjectForm, session: e.target.value})} className="w-full p-2 border rounded text-gray-900">
                {sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">{editingItem ? 'Update' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}

      {showModal && modalType === 'result' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Result' : 'Enter Single Result'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-700 hover:text-gray-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddResult} className="space-y-3">
              <select value={resultForm.student_id} onChange={(e) => setResultForm({...resultForm, student_id: e.target.value})} required className="w-full p-2 border rounded text-gray-900">
                <option value="">Select Student</option>
                {students.filter(s => s.class_id === selectedClass).map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}
              </select>
              <select value={resultForm.subject_id} onChange={(e) => setResultForm({...resultForm, subject_id: e.target.value})} required className="w-full p-2 border rounded text-gray-900">
                <option value="">Select Subject</option>
                {subjects.filter(s => s.class_id === selectedClass).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <input type="number" placeholder="CA (0-40)" value={resultForm.ca_score} onChange={(e) => setResultForm({...resultForm, ca_score: e.target.value})} className="w-full p-2 border rounded text-gray-900"/>
                <input type="number" placeholder="Exam (0-60)" value={resultForm.exam_score} onChange={(e) => setResultForm({...resultForm, exam_score: e.target.value})} className="w-full p-2 border rounded text-gray-900"/>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">{editingItem ? 'Update' : 'Save Result'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}