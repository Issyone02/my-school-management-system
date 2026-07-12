'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isTeacherPage = pathname?.startsWith('/teacher');
  const isParentPage = pathname?.startsWith('/parent');
  const isStudentPage = pathname?.startsWith('/student');

  // Hide footer on portal pages (admin, teacher, parent, student)
  const showFooter = !isAdminPage && !isTeacherPage && !isParentPage && !isStudentPage;

  return (
    <>
      {children}
      {showFooter && <Footer />}
    </>
  );
}