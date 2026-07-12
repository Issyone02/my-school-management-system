export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">My Results 👷</h1>
      <p className="text-gray-700">View all your termly results and academic reports.</p>
      <a href="/student" className="text-orange-600 hover:underline mt-4 inline-block font-medium">← Back to Dashboard</a>
    </div>
  );
}