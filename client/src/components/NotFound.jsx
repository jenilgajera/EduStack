import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

function NotFound() {
  return (
    <section className="bg-gradient-to-br from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="w-full max-w-md bg-gray-900/95 rounded-lg shadow border border-gray-800 transform transition-all duration-300 hover:shadow-xl mx-auto">
        <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 text-center text-gray-200">

          <div className="flex justify-center mb-6">
            <div className="p-3 bg-red-800/40 rounded-full transition-transform duration-300 hover:scale-105">
              <AlertCircle className="h-12 w-12 sm:h-14 sm:w-14 text-red-400" strokeWidth={1.5} />
            </div>
          </div>

       
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-gray-100 drop-shadow-md">
            404 - Page Not Found
          </h1>


          <p className="text-sm sm:text-base text-gray-400">
            Oops! It looks like you’ve wandered off the path. The page you’re looking for doesn’t exist.
          </p>

          {/* Back to Home Button */}
          <Link
            to="/"
            className="inline-block text-gray-100 bg-cyan-800 hover:bg-cyan-900 focus:ring-4 focus:outline-none focus:ring-cyan-700 focus:ring-opacity-50 font-medium rounded-lg text-sm px-5 py-2.5 transition-all duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;