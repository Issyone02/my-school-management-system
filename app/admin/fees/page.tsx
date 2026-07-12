'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, FileText, Download, Printer, Eye, Edit, Trash2, X, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface FeeStructure {
  id: string
  name: string
  class_id: string
  term: string
  session: string
  amount: number
  description?: string
  due_date?: string
  active: boolean
}

interface PaymentRecord {
  id: string
  student_id: string
  student_name: string
  admission_number: string
  amount_paid: number
  payment_date: string
  payment_method: string
  reference_number: string
  receipt_number: string
  paid_by: string
  notes?: string
}

interface Student {
  id: string
  full_name: string
  admission_number: string
  class_id: string
}

export default function FeeManagementPage() {
  const [activeTab, setActiveTab] = useState<'structures' | 'payments' | 'reports' | 'requests'>('structures')
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'structure' | 'payment' | 'view'>('structure')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null)
  const [paymentRequests, setPaymentRequests] = useState<any[]>([])
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [viewingRequest, setViewingRequest] = useState<any>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const classOptions = [
    { id: 'jss1', name: 'JSS 1' }, { id: 'jss2', name: 'JSS 2' }, { id: 'jss3', name: 'JSS 3' },
    { id: 'ss1', name: 'SS 1' }, { id: 'ss2', name: 'SS 2' }, { id: 'ss3', name: 'SS 3' },
  ]
  const termOptions = ['First Term', 'Second Term', 'Third Term']
  const sessionOptions = ['2023/2024', '2024/2025', '2025/2026', '2026/2027']
  const paymentMethodOptions = ['Cash', 'Transfer', 'Card', 'Cheque']

  const [structureForm, setStructureForm] = useState({ name: '', class_id: 'jss1', term: 'First Term', session: '2024/2025', amount: '', description: '', due_date: '', active: true })
  const [paymentForm, setPaymentForm] = useState({ student_id: '', amount_paid: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Transfer', reference_number: '', receipt_number: '', paid_by: '', notes: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
  await Promise.all([fetchFeeStructures(), fetchPayments(), fetchStudents(), fetchPaymentRequests()])
  setLoading(false)
}

  const fetchFeeStructures = async () => {
    const { data, error } = await supabase.from('fee_structures').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to load fee structures')
    else setFeeStructures(data || [])
  }

  const fetchPayments = async () => {
    const { data, error } = await supabase.from('fee_payments').select(`*, student:students(full_name, admission_number)`).order('payment_date', { ascending: false })
    if (error) toast.error('Failed to load payments')
    else setPayments((data || []).map((p: any) => ({ ...p, student_name: p.student?.full_name || 'Unknown', admission_number: p.student?.admission_number || 'N/A' })))
  }


  const fetchPaymentRequests = async () => {
  const { data, error } = await supabase
    .from('payment_requests')
    .select(`
      *,
      student:students(full_name, admission_number, class_id),
      fee_structures(name, amount)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching payment requests:', error)
    return
  }
  
  const enriched = (data || []).map((r: any) => ({
    ...r,
    student_name: r.student?.full_name || 'Unknown',
    admission_number: r.student?.admission_number || 'N/A',
    class_id: r.student?.class_id || 'N/A',
    fee_name: r.fee_structures?.name || 'Unknown',
    fee_amount: r.fee_structures?.amount || 0
  }))
  
  setPaymentRequests(enriched)
  setPendingRequestsCount(enriched.filter(r => r.status === 'pending').length)
}

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, full_name, admission_number, class_id').order('full_name')
    setStudents(data || [])
  }

  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await supabase.from('fee_structures').update({ name: structureForm.name, class_id: structureForm.class_id, term: structureForm.term, session: structureForm.session, amount: parseFloat(structureForm.amount), description: structureForm.description || null, due_date: structureForm.due_date || null, active: structureForm.active }).eq('id', editingItem.id)
        toast.success('Fee structure updated!')
      } else {
        await supabase.from('fee_structures').insert([{ name: structureForm.name, class_id: structureForm.class_id, term: structureForm.term, session: structureForm.session, amount: parseFloat(structureForm.amount), description: structureForm.description || null, due_date: structureForm.due_date || null, active: structureForm.active }])
        toast.success('Fee structure added!')
      }
      setShowModal(false)
      setStructureForm({ name: '', class_id: 'jss1', term: 'First Term', session: '2024/2025', amount: '', description: '', due_date: '', active: true })
      setEditingItem(null)
      fetchFeeStructures()
    } catch (error: any) { toast.error('Failed: ' + error.message) }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const receiptNumber = `REC/${new Date().getFullYear()}/${String(payments.length + 1).padStart(4, '0')}`
      await supabase.from('fee_payments').insert([{ student_id: paymentForm.student_id, amount_paid: parseFloat(paymentForm.amount_paid), payment_date: paymentForm.payment_date, payment_method: paymentForm.payment_method, reference_number: paymentForm.reference_number || null, receipt_number: receiptNumber, paid_by: paymentForm.paid_by, notes: paymentForm.notes || null }])
      toast.success(`Payment recorded! Receipt: ${receiptNumber}`)
      setShowModal(false)
      setPaymentForm({ student_id: '', amount_paid: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Transfer', reference_number: '', receipt_number: '', paid_by: '', notes: '' })
      fetchPayments()
    } catch (error: any) { toast.error('Failed: ' + error.message) }
  }

  const handleDeleteStructure = async (id: string) => { if (!confirm('Delete?')) return; try { await supabase.from('fee_structures').delete().eq('id', id); toast.success('Deleted!'); fetchFeeStructures() } catch (error: any) { toast.error('Failed: ' + error.message) } }
  const handleDeletePayment = async (id: string) => { if (!confirm('Delete?')) return; try { await supabase.from('fee_payments').delete().eq('id', id); toast.success('Deleted!'); fetchPayments() } catch (error: any) { toast.error('Failed: ' + error.message) } }
  const handleApproveRequest = async (request: any) => {
  if (!confirm(`Approve payment of ₦${request.amount.toLocaleString()} for ${request.student_name}?`)) return
  
  try {
    const receiptNumber = `REC/${new Date().getFullYear()}/${String(payments.length + 1).padStart(4, '0')}`
    
    // ✅ FIXED: Remove created_by or set to null
    const { error: paymentError } = await supabase.from('fee_payments').insert([{
      student_id: request.student_id,
      fee_structure_id: request.fee_structure_id,
      amount_paid: request.amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: request.payment_method,
      reference_number: request.reference_number || receiptNumber,
      receipt_number: receiptNumber,
      paid_by: request.student_name,
      notes: adminNotes || request.notes || null
      // ❌ REMOVE THIS LINE: created_by: 'admin'
    }])
    
    if (paymentError) throw paymentError
    
    const { error: requestError } = await supabase
      .from('payment_requests')
      .update({ 
        status: 'approved',
        admin_notes: adminNotes || 'Approved by admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id)
    
    if (requestError) throw requestError
    
    toast.success(`Payment approved! Receipt: ${receiptNumber}`)
    setShowRequestModal(false)
    setAdminNotes('')
    fetchPaymentRequests()
    fetchPayments()
  } catch (error: any) {
    toast.error('Failed to approve: ' + error.message)
  }
}

const handleRejectRequest = async (request: any) => {
  const reason = prompt('Enter rejection reason (required):')
  if (!reason) return
  
  try {
    const { error } = await supabase
      .from('payment_requests')
      .update({ 
        status: 'rejected',
        admin_notes: `Rejected: ${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id)
    
    if (error) throw error
    
    toast.success('Payment request rejected')
    setShowRequestModal(false)
    setAdminNotes('')
    fetchPaymentRequests()
  } catch (error: any) {
    toast.error('Failed to reject: ' + error.message)
  }
}



  const exportToExcel = () => {
    const headers = ['Receipt', 'Student', 'Admission', 'Amount', 'Date', 'Method', 'PaidBy']
    const rows = payments.map(p => [p.receipt_number, p.student_name, p.admission_number, p.amount_paid, p.payment_date, p.payment_method, p.paid_by])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `fees_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Exported to CSV!')
  }

  const saveAsJPG = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const element = document.getElementById('receipt-content')
      if (element) {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
        const link = document.createElement('a')
        link.download = `receipt_${selectedReceipt?.receipt_number}.jpg`
        link.href = canvas.toDataURL('image/jpeg', 0.9)
        link.click()
        toast.success('Receipt saved as JPG!')
      }
    } catch (error: any) { toast.error('Failed: ' + error.message) }
  }

  const handlePrint = () => {
  const content = document.getElementById('receipt-content');
  if (!content) return;
  
  // Create print window
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    window.print();
    return;
  }
  
  // Write content to new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${selectedReceipt?.receipt_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #000; background: #fff; }
        h3 { text-align: center; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin: 12px 0; padding-bottom: 8px; border-bottom: 1px solid #ccc; }
        .label { color: #555; }
        .value { font-weight: bold; color: #000; }
        .amount { color: #22c55e; }
      </style>
    </head>
    <body>
      <h3>Greenfield Academy</h3>
      <p style="text-align:center;color:#666">Payment Receipt</p>
      <div class="row"><span class="label">Receipt:</span><span class="value">${selectedReceipt?.receipt_number}</span></div>
      <div class="row"><span class="label">Student:</span><span class="value">${selectedReceipt?.student_name}</span></div>
      <div class="row"><span class="label">Admission:</span><span class="value">${selectedReceipt?.admission_number}</span></div>
      <div class="row"><span class="label">Amount:</span><span class="value amount">₦${selectedReceipt?.amount_paid.toLocaleString()}</span></div>
      <div class="row"><span class="label">Date:</span><span class="value">${new Date(selectedReceipt?.payment_date || '').toLocaleDateString()}</span></div>
      <div class="row"><span class="label">Method:</span><span class="value">${selectedReceipt?.payment_method}</span></div>
      <div class="row"><span class="label">Paid By:</span><span class="value">${selectedReceipt?.paid_by}</span></div>
      <script>window.onload = function() { window.print(); window.close(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

  const totalCollected = payments.reduce((s, p) => s + p.amount_paid, 0)
  const totalStructures = feeStructures.reduce((s, f) => s + f.amount, 0)
  const filteredStructures = feeStructures.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.class_id.includes(searchTerm.toLowerCase()))
  const filteredPayments = payments.filter(p => p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.receipt_number.includes(searchTerm.toLowerCase()))

  if (loading) return <div className="p-8 text-gray-900 font-bold">Loading...</div>

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Fee Management</h1><p className="text-gray-700">Manage fees and payments</p></div>
        <div className="flex gap-3">
          <button onClick={() => { setModalType('structure'); setEditingItem(null); setShowModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700"><Plus size={18}/>Add Structure</button>
          <button onClick={() => { setModalType('payment'); setEditingItem(null); setShowModal(true) }} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-700"><DollarSign size={18}/>Record Payment</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-600 font-medium">Collected</p><p className="text-2xl font-bold text-green-600">₦{totalCollected.toLocaleString()}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-600 font-medium">Structures</p><p className="text-2xl font-bold text-blue-600">₦{totalStructures.toLocaleString()}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-sm text-gray-600 font-medium">Pending</p><p className="text-2xl font-bold text-orange-600">₦{Math.max(0, totalStructures - totalCollected).toLocaleString()}</p></div>
      </div>

      <div className="bg-white rounded shadow">
        <div className="flex border-b overflow-x-auto">
  <button onClick={() => setActiveTab('structures')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'structures' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>Structures</button>
  <button onClick={() => setActiveTab('payments')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>Payments</button>
  <button onClick={() => setActiveTab('requests')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>
    Payment Requests
    {pendingRequestsCount > 0 && (
      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequestsCount}</span>
    )}
  </button>
  <button onClick={() => setActiveTab('reports')} className={`px-4 py-3 font-bold text-gray-900 whitespace-nowrap ${activeTab === 'reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'}`}>Reports</button>
</div>

        <div className="p-4">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded mb-4 text-gray-900 placeholder-gray-500" />
          {activeTab === 'structures' && <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="p-2 text-left text-gray-900 font-bold">Name</th><th className="text-gray-900 font-bold">Class</th><th className="text-gray-900 font-bold">Term</th><th className="text-gray-900 font-bold">Session</th><th className="text-gray-900 font-bold">Amount</th><th className="text-gray-900 font-bold">Actions</th></tr></thead><tbody>{filteredStructures.map(f => <tr key={f.id} className="border-t hover:bg-gray-50"><td className="p-2 text-gray-900 font-medium">{f.name}</td><td className="text-gray-900">{f.class_id}</td><td className="text-gray-900">{f.term}</td><td className="text-gray-900">{f.session}</td><td className="text-gray-900 font-bold">₦{f.amount.toLocaleString()}</td><td><button onClick={() => { setEditingItem(f); setStructureForm({ name: f.name, class_id: f.class_id, term: f.term, session: f.session, amount: f.amount.toString(), description: f.description || '', due_date: f.due_date || '', active: f.active }); setModalType('structure'); setShowModal(true) }} className="text-blue-600 hover:text-blue-800 mr-2"><Edit size={16}/></button><button onClick={() => handleDeleteStructure(f.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>}
          {activeTab === 'payments' && <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="p-2 text-left text-gray-900 font-bold">Receipt</th><th className="text-gray-900 font-bold">Student</th><th className="text-gray-900 font-bold">Amount</th><th className="text-gray-900 font-bold">Date</th><th className="text-gray-900 font-bold">Actions</th></tr></thead><tbody>{filteredPayments.map(p => <tr key={p.id} className="border-t hover:bg-gray-50"><td className="p-2 text-gray-900 font-medium">{p.receipt_number}</td><td className="text-gray-900 font-medium">{p.student_name}</td><td className="text-gray-900 font-bold">₦{p.amount_paid.toLocaleString()}</td><td className="text-gray-900">{new Date(p.payment_date).toLocaleDateString()}</td><td><button onClick={() => { setSelectedReceipt(p); setModalType('view'); setShowModal(true) }} className="text-purple-600 hover:text-purple-800 mr-2"><Eye size={16}/></button><button onClick={() => handleDeletePayment(p.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>}
          {activeTab === 'reports' && <div><button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 font-bold"><Download size={16}/>Export CSV</button></div>}
          {activeTab === 'requests' && (
  <div className="space-y-4">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-700 font-medium">Pending</p>
        <p className="text-2xl font-bold text-yellow-900">{paymentRequests.filter(r => r.status === 'pending').length}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <p className="text-sm text-green-700 font-medium">Approved</p>
        <p className="text-2xl font-bold text-green-900">{paymentRequests.filter(r => r.status === 'approved').length}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm text-red-700 font-medium">Rejected</p>
        <p className="text-2xl font-bold text-red-900">{paymentRequests.filter(r => r.status === 'rejected').length}</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 font-medium">Total Amount</p>
        <p className="text-2xl font-bold text-blue-900">₦{paymentRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</p>
      </div>
    </div>

    {/* Filter Buttons */}
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => setActiveTab('requests')} className="px-4 py-2 bg-gray-100 rounded font-bold text-gray-700 hover:bg-gray-200">All</button>
      <button className="px-4 py-2 bg-yellow-100 rounded font-bold text-yellow-800 hover:bg-yellow-200">Pending ({paymentRequests.filter(r => r.status === 'pending').length})</button>
      <button className="px-4 py-2 bg-green-100 rounded font-bold text-green-800 hover:bg-green-200">Approved</button>
      <button className="px-4 py-2 bg-red-100 rounded font-bold text-red-800 hover:bg-red-200">Rejected</button>
    </div>

    {/* Requests Table */}
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-gray-900 font-bold">Student</th>
            <th className="text-gray-900 font-bold">Fee</th>
            <th className="text-gray-900 font-bold">Amount</th>
            <th className="text-gray-900 font-bold">Method</th>
            <th className="text-gray-900 font-bold">Reference</th>
            <th className="text-gray-900 font-bold">Status</th>
            <th className="text-gray-900 font-bold">Date</th>
            <th className="text-gray-900 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paymentRequests.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-600">
                <FileText size={48} className="mx-auto text-gray-300 mb-2"/>
                <p className="font-bold">No payment requests yet</p>
                <p className="text-sm">Parents will see this when they submit payments</p>
              </td>
            </tr>
          ) : (
            paymentRequests.map(request => (
              <tr key={request.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-bold text-gray-900">{request.student_name}</p>
                  <p className="text-sm text-gray-600">{request.admission_number} • {request.class_id}</p>
                </td>
                <td className="text-gray-900">{request.fee_name}</td>
                <td className="font-bold text-gray-900">₦{request.amount.toLocaleString()}</td>
                <td className="text-gray-900 capitalize">{request.payment_method}</td>
                <td className="text-gray-900 text-sm">{request.reference_number || '-'}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status}
                  </span>
                </td>
                <td className="text-gray-900 text-sm">{new Date(request.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setViewingRequest(request); setShowRequestModal(true) }}
                      className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                    >
                      {request.status === 'pending' ? 'Review' : 'View'}
                    </button>
                    {request.proof_image_url && (
                      <a
                        href={request.proof_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        Proof
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
        </div>
      </div>

      {showModal && modalType === 'structure' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Fee Structure' : 'Add Fee Structure'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-700 hover:text-gray-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddStructure} className="space-y-3">
              <input placeholder="Name" value={structureForm.name} onChange={(e) => setStructureForm({...structureForm, name: e.target.value})} required className="w-full p-2 border rounded text-gray-900"/>
              <select value={structureForm.class_id} onChange={(e) => setStructureForm({...structureForm, class_id: e.target.value})} className="w-full p-2 border rounded text-gray-900">{classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select value={structureForm.term} onChange={(e) => setStructureForm({...structureForm, term: e.target.value})} className="w-full p-2 border rounded text-gray-900">{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select value={structureForm.session} onChange={(e) => setStructureForm({...structureForm, session: e.target.value})} className="w-full p-2 border rounded text-gray-900">{sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <input type="number" placeholder="Amount" value={structureForm.amount} onChange={(e) => setStructureForm({...structureForm, amount: e.target.value})} required className="w-full p-2 border rounded text-gray-900"/>
              <input type="date" value={structureForm.due_date} onChange={(e) => setStructureForm({...structureForm, due_date: e.target.value})} className="w-full p-2 border rounded text-gray-900"/>
              <textarea placeholder="Description" value={structureForm.description} onChange={(e) => setStructureForm({...structureForm, description: e.target.value})} className="w-full p-2 border rounded text-gray-900" rows={2}/>
              <div className="flex items-center gap-2"><input type="checkbox" id="active" checked={structureForm.active} onChange={(e) => setStructureForm({...structureForm, active: e.target.checked})} className="w-4 h-4"/><label htmlFor="active" className="text-gray-900 font-medium">Active</label></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">{editingItem ? 'Update' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}

      {showModal && modalType === 'payment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-700 hover:text-gray-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddPayment} className="space-y-3">
              <select value={paymentForm.student_id} onChange={(e) => setPaymentForm({...paymentForm, student_id: e.target.value})} required className="w-full p-2 border rounded text-gray-900"><option value="">Select Student</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}</select>
              <input type="number" placeholder="Amount" value={paymentForm.amount_paid} onChange={(e) => setPaymentForm({...paymentForm, amount_paid: e.target.value})} required className="w-full p-2 border rounded text-gray-900"/>
              <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} className="w-full p-2 border rounded text-gray-900">{paymentMethodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select>
              <input placeholder="Paid By" value={paymentForm.paid_by} onChange={(e) => setPaymentForm({...paymentForm, paid_by: e.target.value})} required className="w-full p-2 border rounded text-gray-900"/>
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Save</button>
            </form>
          </div>
        </div>
      )}


      {/* Payment Request Review Modal */}
{showRequestModal && viewingRequest && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          {viewingRequest.status === 'pending' ? 'Review Payment Request' : 'Payment Details'}
        </h2>
        <button onClick={() => { setShowRequestModal(false); setViewingRequest(null); setAdminNotes('') }} className="text-gray-700 hover:text-gray-900">
          <X size={24}/>
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Student & Fee Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Student</p>
            <p className="font-bold text-gray-900">{viewingRequest.student_name}</p>
            <p className="text-sm text-gray-600">{viewingRequest.admission_number}</p>
            <p className="text-sm text-gray-600">{viewingRequest.class_id}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Fee</p>
            <p className="font-bold text-gray-900">{viewingRequest.fee_name}</p>
            <p className="text-sm text-gray-600">₦{viewingRequest.fee_amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-bold text-blue-900 mb-3">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <span className="text-blue-700">Amount:</span>
              <span className="font-bold text-blue-900 ml-2">₦{viewingRequest.amount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-blue-700">Method:</span>
              <span className="font-bold text-blue-900 ml-2 capitalize">{viewingRequest.payment_method}</span>
            </div>
            <div>
              <span className="text-blue-700">Reference:</span>
              <span className="font-bold text-blue-900 ml-2">{viewingRequest.reference_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-blue-700">Date:</span>
              <span className="font-bold text-blue-900 ml-2">{new Date(viewingRequest.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Proof Image */}
        {viewingRequest.proof_image_url && (
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Payment Proof</h3>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={viewingRequest.proof_image_url}
                alt="Payment proof"
                className="w-full h-auto max-h-96 object-contain bg-gray-100"
              />
            </div>
            <a
              href={viewingRequest.proof_image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            >
              Open in new tab →
            </a>
          </div>
        )}

        {/* Notes */}
        {viewingRequest.notes && (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold text-gray-900 mb-2">Parent Notes</h3>
            <p className="text-gray-700">{viewingRequest.notes}</p>
          </div>
        )}

        {/* Admin Notes */}
        {viewingRequest.admin_notes && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-bold text-yellow-900 mb-2">Admin Notes</h3>
            <p className="text-yellow-800">{viewingRequest.admin_notes}</p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-bold">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            viewingRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            viewingRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {viewingRequest.status}
          </span>
        </div>

        {/* Action Buttons (only for pending) */}
        {viewingRequest.status === 'pending' && (
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-900 mb-3">Admin Actions</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
                rows={2}
                placeholder="Add notes about this payment..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleApproveRequest(viewingRequest)}
                className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18}/> Approve Payment
              </button>
              <button
                onClick={() => handleRejectRequest(viewingRequest)}
                className="flex-1 bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <X size={18}/> Reject
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              ⚠️ Approving will create a fee payment record and update the student's balance
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {showModal && modalType === 'view' && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" id="receipt-modal">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center no-print">
              <h2 className="text-lg font-bold text-gray-900">Receipt</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-700 hover:text-gray-900"><X size={20}/></button>
            </div>
            <div className="p-4" id="receipt-content" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
  <div className="text-center mb-4">
    <h3 className="text-xl font-bold" style={{ color: '#000000' }}>Greenfield Academy</h3>
    <p style={{ color: '#333333' }}>Payment Receipt</p>
  </div>
  <div className="space-y-2 text-sm">
    <div style={{ color: '#000000' }}><strong style={{ color: '#555555' }}>Receipt:</strong> {selectedReceipt.receipt_number}</div>
    <div style={{ color: '#000000' }}><strong style={{ color: '#555555' }}>Student:</strong> {selectedReceipt.student_name}</div>
    <div style={{ color: '#000000' }}><strong style={{ color: '#555555' }}>Admission:</strong> {selectedReceipt.admission_number}</div>
    <div style={{ color: '#000000' }}><strong style={{ color: '#555555' }}>Amount:</strong> <span style={{ color: '#22c55e' }}>₦{selectedReceipt.amount_paid.toLocaleString()}</span></div>
    <div style={{ color: '#000000' }}><strong style={{ color: '#555555' }}>Date:</strong> {new Date(selectedReceipt.payment_date).toLocaleDateString()}</div>
    <div style={{ color: '#000000' }}><strong style={{ color: '#555555' }}>Method:</strong> {selectedReceipt.payment_method}</div>
    <div style={{ color: '#000000' }}><strong style={{ color: '#555555' }}>Paid By:</strong> {selectedReceipt.paid_by}</div>
  </div>
</div>
            <div className="p-4 border-t bg-gray-50 no-print">
              <div className="flex justify-center gap-2 flex-wrap">
                <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold">Print</button>
<button onClick={handlePrint} className="bg-purple-600 text-white px-3 py-2 rounded text-sm font-bold">Save PDF</button>
                <button onClick={saveAsJPG} className="bg-green-600 text-white px-3 py-2 rounded text-sm font-bold">Save JPG</button>
                <button onClick={() => setShowModal(false)} className="px-3 py-2 border rounded text-sm font-bold text-gray-900">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}