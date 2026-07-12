import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { BookOpen, Users, Trophy, Calendar } from 'lucide-react';

export default function Home() {
  const stats = [
    { icon: Trophy, value: '98%', label: 'WAEC Pass Rate' },
    { icon: Users, value: '1,200+', label: 'Students Enrolled' },
    { icon: BookOpen, value: '#1', label: 'School in Lagos' },
    { icon: Calendar, value: '25+', label: 'Years of Excellence' },
  ];

  return (
    <div className="min-h-screen">


      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Where <span className="text-yellow-300">excellence</span> meets purpose
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Greenfield Academy prepares the next generation of Nigerian leaders through world-class academics, 
              holistic development, and a culture of discipline and innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admissions"
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors"
              >
                Contact Admissions
              </Link>
              <Link
                href="/about"
                className="bg-white text-green-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Discover More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                A tradition of excellence since 1998
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Greenfield Academy was founded with a single conviction: that Nigerian children deserve a world-class 
                education in their own country. Today, we are the leading private secondary school in Lagos.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Modern Facilities</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Holistic Development</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">WAEC & NECO Excellence</span>
                </li>
              </ul>
            </div>            <div className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
              <span className="text-gray-500">School Image Placeholder</span>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Programs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-48 bg-green-600 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Junior Secondary School</h3>
                <p className="text-gray-600">
                  Strong foundational education across core subjects. Building literacy, numeracy, and critical thinking.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-48 bg-blue-600 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Sciences & Technology</h3>
                <p className="text-gray-600">
                  Physics, Chemistry, Biology, and ICT in fully-equipped modern labs. Preparing future engineers and doctors.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-48 bg-purple-600 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Humanities & Arts</h3>
                <p className="text-gray-600">
                  Literature, Government, History, and Creative Arts. Developing articulate and culturally aware leaders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join the Greenfield Family?</h2>
          <p className="text-xl mb-8 text-green-100">
            Admissions are now open for the 2024/2025 academic session. Speak with our admissions team today.
          </p>
          <Link
            href="/admissions"
            className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors inline-block"
          >
            Apply Now
          </Link>
        </div>
      </section>

    </div>
  );
}