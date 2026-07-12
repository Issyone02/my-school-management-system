import AdminSidebar from '@/components/admin/AdminSidebar' // Adjust path if needed

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar takes its own space */}
      <AdminSidebar />
      
      {/* Main content takes the rest of the space. NO margin needed! */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}