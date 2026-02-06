'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* ================= TYPES ================= */

type Pledge = {
  id: string;
  pledgeDate: string;
  loanAmount: string;
  itemType: string;
  itemName: string;
  interestRate: string;
  status: string;
};

type CustomerWithPledges = {
  id: string;
  name: string;
  mobile: string | null;
  address: string;
  aadharNo: string | null;
  pledges: Pledge[];
};

/* ================= PAGE ================= */

export default function CustomerDetailsPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerWithPledges | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ========== FETCH CUSTOMER + PLEDGES ========== */
  useEffect(() => {
    if (!customerId) return;

    setCustomer(null);
    setError('');
    setLoading(true);

    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${customerId}`, {
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load customer');
        }

        setCustomer(data.customer);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [customerId]);

  /* ================= STATES ================= */

  if (loading) {
    return <p className="p-6">Loading customer...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (!customer) {
    return <p className="p-6">Customer not found</p>;
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* ===== CUSTOMER INFO ===== */}
      <div className="border rounded p-4 bg-gray-50">
        <h1 className="text-2xl font-bold mb-2">
          {customer.name}
        </h1>

        <p><b>Mobile:</b> {customer.mobile || 'N/A'}</p>
        <p><b>Address:</b> {customer.address}</p>
        <p><b>Aadhar:</b> {customer.aadharNo || 'N/A'}</p>

        <button
          onClick={() => router.push(`/customers/${customerId}/pledge`)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          ➕ Add Pledge
        </button>
      </div>

      {/* ===== PLEDGES ===== */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Pledges</h2>

        {customer.pledges.length === 0 ? (
          <p className="text-gray-500">No pledges found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Item</th>
                  <th className="border p-2">Loan</th>
                  <th className="border p-2">Interest %</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.pledges.map((p) => (
                  <tr key={p.id}>
                    <td className="border p-2">
                      {new Date(p.pledgeDate).toLocaleDateString()}
                    </td>
                    <td className="border p-2">
                      {p.itemName} ({p.itemType})
                    </td>
                    <td className="border p-2">
                      ₹{p.loanAmount}
                    </td>
                    <td className="border p-2">
                      {p.interestRate}%
                    </td>
                    <td className="border p-2">
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
