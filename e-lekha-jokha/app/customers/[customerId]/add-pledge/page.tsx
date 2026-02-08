"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function AddPledgePage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params?.customerId;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href={customerId ? `/customers/${customerId}` : "/customers"}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to Customer
        </Link>
        <h1 className="text-2xl font-bold mt-2">Add Pledge</h1>
        <p className="text-sm text-gray-500">
          Start a new pledge for this customer. This page can be wired to the pledge
          form and backend when ready.
        </p>
      </div>

      <div className="border rounded p-4 bg-white shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Item Name</label>
            <input
              className="mt-1 w-full border rounded p-2"
              placeholder="Gold Ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Loan Amount</label>
            <input className="mt-1 w-full border rounded p-2" placeholder="₹" />
          </div>
          <div>
            <label className="block text-sm font-medium">Pledge Date</label>
            <input type="date" className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select className="mt-1 w-full border rounded p-2">
              <option value="ACTIVE">Active</option>
              <option value="RELEASED">Released</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 bg-black text-white px-4 py-2 rounded hover:opacity-90"
        >
          Save Pledge
        </button>
      </div>
    </div>
  );
}
