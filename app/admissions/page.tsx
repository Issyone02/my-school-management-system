export default function AdmissionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Admissions</h1>
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admissions Open for 2024/2025</h2>
          <ul className="space-y-3 text-gray-700">
            <li>• Entrance examinations held monthly</li>
            <li>• Classes: JSS 1 - SS 3</li>
            <li>• Required: Birth certificate, previous results, 2 passport photos</li>
            <li>• Application fee: ₦5,000 (non-refundable)</li>
          </ul>
          <a href="/contact" className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
            Contact Admissions →
          </a>
        </div>
      </div>
    </div>
  );
}