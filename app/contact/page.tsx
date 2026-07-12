export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <div className="space-y-4 text-gray-700">
            <p><strong className="text-gray-900">📍 Address:</strong> 14 Admiralty Way, Lekki Phase 1, Lagos</p>
            <p><strong className="text-gray-900">📞 Phone:</strong> +234 (0) 803 456 7890</p>
            <p><strong className="text-gray-900">✉️ Email:</strong> info@greenfieldacademy.edu.ng</p>
            <p><strong className="text-gray-900">🕒 Office Hours:</strong> Mon-Fri, 7:30AM - 4:00PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}