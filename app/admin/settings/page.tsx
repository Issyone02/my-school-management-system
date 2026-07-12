export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Coming Soon 👷
      </h1>
      <p className="text-gray-600">
        This feature is under development. Check back soon!
      </p>
      <div className="mt-6">
        <a href="/admin" className="text-green-600 hover:underline">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}