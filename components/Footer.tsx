import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* School Info */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Greenfield Academy</h3>
            <p className="text-gray-400 mb-4">
              Lagos's premier private secondary school, producing Nigeria's brightest minds since 1998.
            </p>
            <div className="space-y-2 text-gray-400">
              <p>📍 14 Admiralty Way, Lekki Phase 1, Lagos</p>
              <p>📞 +234 (0) 803 456 7890</p>
              <p>✉️ info@greenfieldacademy.edu.ng</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/academics" className="text-gray-400 hover:text-white transition-colors">Academics</Link></li>
              <li><Link href="/admissions" className="text-gray-400 hover:text-white transition-colors">Admissions</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-lg font-bold mb-4">Portals</h4>
            <ul className="space-y-2">
              <li><Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Admin Portal</Link></li>
              <li><Link href="/teacher" className="text-gray-400 hover:text-white transition-colors">Teacher Portal</Link></li>
              <li><Link href="/parent" className="text-gray-400 hover:text-white transition-colors">Parent Portal</Link></li>
              <li><Link href="/student" className="text-gray-400 hover:text-white transition-colors">Student Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Greenfield Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}