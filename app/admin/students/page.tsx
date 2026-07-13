'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Search, X, Save, User, GraduationCap, Home, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Student {
  id: string;
  user_id?: string;
  admission_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  class_id?: string;
  class_name?: string;
  department?: string;
  house: string | null;
  state: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  active: boolean;
  created_at: string;
}

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    admission_number: '',
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    class_id: '',
    department: '',
    house: '',
    state: '',
    address: '',    emergency_contact: '',
    emergency_phone: '',
    create_portal_account: false,
    user_email: '',
    active: true,
    user_id: null as string | null,
  });

  const classOptions = [
    { id: 'jss1', name: 'JSS 1' }, { id: 'jss2', name: 'JSS 2' }, { id: 'jss3', name: 'JSS 3' },
    { id: 'ss1', name: 'SS 1' }, { id: 'ss2', name: 'SS 2' }, { id: 'ss3', name: 'SS 3' },
  ];

  const departmentOptions = ['Sciences', 'Arts', 'Commercial'];
  const houses = ['Red House', 'Blue House', 'Green House', 'Yellow House'];
  const [showDepartment, setShowDepartment] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchUsers();
  }, []);

  useEffect(() => {
    const isSenior = ['ss1', 'ss2', 'ss3'].includes(formData.class_id);
    setShowDepartment(isSenior);
    if (!isSenior) setFormData(prev => ({ ...prev, department: '' }));
  }, [formData.class_id]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('students').select('*').order('full_name');
      if (error) throw error;
      const enriched = (data || []).map((s: any) => {
        const cls = classOptions.find(c => c.id === s.class_id);
        return { ...s, class_name: cls?.name || s.class_id || 'N/A' };
      });
      setStudents(enriched);
    } catch (error: any) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, email, full_name, role').or(`role.eq.student,role.is.null`).order('email');
    setUsers(data || []);
  };

  const createClerkUser = async (email: string, fullName: string) => {
    try {      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, role: 'student', phone: '' }),
      });
      const result = await response.json();
      if (result.success) {
        const { data } = await supabase.from('users').select('id').eq('clerk_id', result.clerkId).single();
        return data?.id || null;
      }
      return null;
    } catch (error) {
      console.error('Error creating Clerk user:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let userId: string | null = formData.user_id || null;

      if (formData.create_portal_account && formData.user_email) {
        userId = await createClerkUser(formData.user_email, formData.full_name);
        if (!userId) toast.error('Failed to create portal account, but student was added');
      } else if (formData.user_email) {
        const user = users.find(u => u.email === formData.user_email);
        if (user) userId = user.id;
      }

      const studentData = {
        admission_number: formData.admission_number,
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        class_id: formData.class_id || null,
        department: formData.department || null,
        house: formData.house || null,
        state: formData.state || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        user_id: userId,
        active: formData.active,
      };

      if (editingStudent) {
        const { error } = await supabase.from('students').update(studentData).eq('id', editingStudent.id);
        if (error) throw error;
        toast.success('Student updated successfully!');      } else {
        const { error } = await supabase.from('students').insert([studentData]);
        if (error) throw error;
        toast.success('Student added successfully!' + (userId ? ' Portal account created!' : ''));
      }

      setShowModal(false);
      setFormData({ admission_number: '', full_name: '', date_of_birth: '', gender: 'male', class_id: '', department: '', house: '', state: '', address: '', emergency_contact: '', emergency_phone: '', create_portal_account: false, user_email: '', active: true, user_id: null });
      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error('Failed: ' + error.message);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      admission_number: student.admission_number,
      full_name: student.full_name,
      date_of_birth: student.date_of_birth?.split('T')[0] || '',
      gender: student.gender,
      class_id: student.class_id || '',
      department: student.department || '',
      house: student.house || '',
      state: student.state || '',
      address: student.address || '',
      emergency_contact: student.emergency_contact || '',
      emergency_phone: student.emergency_phone || '',
      create_portal_account: !!student.user_id,
      user_email: student.user_id ? (users.find(u => u.id === student.user_id)?.email || '') : '',
      active: student.active,
      user_id: student.user_id || null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      toast.success('Student deleted!');
      fetchStudents();
    } catch (error: any) {
      toast.error('Failed: ' + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {      const { error } = await supabase.from('students').update({ active: !currentActive }).eq('id', id);
      if (error) throw error;
      toast.success('Student ' + (!currentActive ? 'activated' : 'deactivated'));
      fetchStudents();
    } catch (error: any) {
      toast.error('Failed: ' + error.message);
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-gray-900 font-bold">Loading...</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1 font-medium">{students.length} students</p>
        </div>
        <button onClick={() => { setEditingStudent(null); setFormData({ admission_number: '', full_name: '', date_of_birth: '', gender: 'male', class_id: '', department: '', house: '', state: '', address: '', emergency_contact: '', emergency_phone: '', create_portal_account: false, user_email: '', active: true, user_id: null }); setShowModal(true); }} className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold">
          <Plus size={20} />
          <span>Add Student</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" />
          </div>
          <select value={formData.class_id} onChange={(e) => setFormData({...formData, class_id: e.target.value})} className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium">
            <option value="">All Classes</option>
            {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={formData.house} onChange={(e) => setFormData({...formData, house: e.target.value})} className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium">
            <option value="">All Houses</option>
            {houses.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <div className="text-gray-600 font-medium">Showing: <span className="text-green-600 font-bold">{filteredStudents.length}</span></div>
        </div>
      </div>
      <div className="table-container bg-white rounded-xl shadow-md border border-gray-200">
        <table className="responsive-table w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="min-w-[200px] px-6 py-4 text-left text-gray-900 font-bold">Student</th>
              <th className="min-w-[150px] px-6 py-4 text-left text-gray-900 font-bold">Admission No</th>
              <th className="min-w-[120px] px-6 py-4 text-left text-gray-900 font-bold">Class</th>
              <th className="min-w-[100px] px-6 py-4 text-left text-gray-900 font-bold">Dept</th>
              <th className="min-w-[120px] px-6 py-4 text-left text-gray-900 font-bold">House</th>
              <th className="min-w-[100px] px-6 py-4 text-left text-gray-900 font-bold">Status</th>
              <th className="min-w-[120px] px-6 py-4 text-left text-gray-900 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-600 font-medium">No students found</td></tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><span className="text-green-700 font-bold">{student.full_name.charAt(0)}</span></div>
                      <div>
                        <div className="font-bold text-gray-900">{student.full_name}</div>
                        <div className="text-xs text-gray-500">DOB: {student.date_of_birth?.split('T')[0] || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{student.admission_number}</td>
                  <td className="px-6 py-4 text-gray-900">{student.class_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-900">{student.department || '—'}</td>
                  <td className="px-6 py-4 text-gray-900">{student.house || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(student.id, student.active)} className={`px-3 py-1 rounded-full text-xs font-bold ${student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {student.active ? '✓ Active' : '✗ Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded font-bold" title="Edit"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(student.id)} className="p-2 text-red-600 hover:bg-red-50 rounded font-bold" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b-2 border-gray-200 sticky top-0 bg-white">              <h2 className="text-2xl font-bold text-gray-900">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-700 hover:text-gray-900 font-bold text-xl"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><User size={20} className="mr-2" /> Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">Full Name *</label><input type="text" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" /></div>
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">Admission Number *</label><input type="text" required value={formData.admission_number} onChange={(e) => setFormData({...formData, admission_number: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" /></div>
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">Date of Birth *</label><input type="date" required value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" /></div>
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">Gender *</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-bold"><option value="male">Male</option><option value="female">Female</option></select></div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><GraduationCap size={20} className="mr-2" /> Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">Class *</label><select value={formData.class_id} onChange={(e) => setFormData({...formData, class_id: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium"><option value="">Select Class</option>{classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  {showDepartment && (<div><label className="block text-sm font-bold text-gray-900 mb-1">Department</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium"><option value="">Select</option>{departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>)}
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">House</label><select value={formData.house} onChange={(e) => setFormData({...formData, house: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium"><option value="">Select House</option>{houses.map((h) => <option key={h} value={h}>{h}</option>)}</select></div>
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">Status</label><select value={formData.active ? 'active' : 'inactive'} onChange={(e) => setFormData({...formData, active: e.target.value === 'active'})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-bold"><option value="active">✓ Active</option><option value="inactive">✗ Inactive</option></select></div>
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center"><Mail size={20} className="mr-2" /> Portal Account (Optional)</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <input type="checkbox" id="create_portal" checked={formData.create_portal_account} onChange={(e) => setFormData({...formData, create_portal_account: e.target.checked})} className="w-5 h-5 text-green-600 rounded" />
                  <label htmlFor="create_portal" className="text-green-900 font-bold">Create portal account for this student</label>
                </div>
                {formData.create_portal_account && (
                  <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Student Email (for login)</label>
                    <input type="email" value={formData.user_email} onChange={(e) => setFormData({...formData, user_email: e.target.value})} className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" placeholder="student@greenfieldacademy.edu.ng" />
                    <p className="text-xs text-green-700 mt-2">✨ Clerk account created automatically. Login credentials sent to this email.</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Home size={20} className="mr-2" /> Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-900 mb-1">Address</label><textarea rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" /></div>
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">State</label><input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" /></div>
                  <div><label className="block text-sm font-bold text-gray-900 mb-1">Emergency Contact</label><input type="text" value={formData.emergency_contact} onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-900 mb-1">Emergency Phone</label><input type="tel" value={formData.emergency_phone} onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium" /></div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-900">Cancel</button>
                <button type="submit" className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold"><Save size={18} /><span>{editingStudent ? 'Update' : 'Add'} Student</span></button>
              </div>
            </form>          </div>
        </div>
      )}
    </div>
  );
}