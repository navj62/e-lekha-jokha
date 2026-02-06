import Link from 'next/link';
import { UserButton, SignOutButton } from '@clerk/nextjs';

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-blue-600">
            Dashboard
          </h1>

          <Link
            href="/add"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            Add Customer
          </Link>

          <Link
            href="/customers"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            View Customers
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <button className="text-sm font-medium text-red-600 hover:text-red-700 transition">
              Sign Out
            </button>
          </SignOutButton>
        </div>

      </div>
    </nav>
  );
}
