'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Customer = {
  id: string;
  name: string;
  mobile: string | null;
  address: string;
  aadharNo: string | null;
};

export default function AddPledgePage() {
  const { customerId } = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    pledgeDate: new Date().toISOString().slice(0, 16),
    loanAmount: '',
    itemType: 'GOLD',
    itemName: '',
    purity: '',
    grossWeight: '',
    netWeight: '',
    interestRate: '',
    compoundingDuration: 'MONTHLY',
    remark: '',
  });

  // Fetch customer
  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const contentType = res.headers.get('content-type');
        let data: any = null;
        if (contentType?.includes('application/json')) {
          data = await res.json();
        }
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load customer');
        }
        console.log('FETCHED CUSTOMER DATA:', data);
        setCustomer(data.customer);
      } catch (err: any) {
        setError(err.message || 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [customerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(
      `/api/customers/${customerId}/pledge`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pledgeDate: new Date(form.pledgeDate).toISOString(),
          loanAmount: Number(form.loanAmount),
          itemType: form.itemType,
          itemName: form.itemName,
          purity: Number(form.purity),
          grossWeight: Number(form.grossWeight),
          netWeight: Number(form.netWeight),
          interestRate: Number(form.interestRate),
          compoundingDuration: form.compoundingDuration,
          remark: form.remark || undefined,
        }),
      }
    );

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      alert(data?.error || 'Something went wrong');
      return;
    }

    router.push(`/customers/${customerId}`);
  };


  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Pledge</h1>

      {/* Customer Info */}
      <div className="bg-blue-50 p-4 rounded mb-6">
        <p><b>Name:</b> {customer?.name}</p>
        <p><b>Mobile:</b> {customer?.mobile || 'N/A'}</p>
        <p><b>Address:</b> {customer?.address}</p>
      </div>

      {/* Pledge Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="datetime-local" name="pledgeDate" value={form.pledgeDate} onChange={handleChange} className="w-full border p-2" required />
        <input type="number" name="loanAmount" placeholder="Loan Amount" value={form.loanAmount} onChange={handleChange} className="w-full border p-2" required />
        <input type="text" name="itemName" placeholder="Item Name" value={form.itemName} onChange={handleChange} className="w-full border p-2" required />
        <input type="number" name="purity" placeholder="Purity" value={form.purity} onChange={handleChange} className="w-full border p-2" required />
        <input type="number" name="grossWeight" placeholder="Gross Weight" value={form.grossWeight} onChange={handleChange} className="w-full border p-2" required />
        <input type="number" name="netWeight" placeholder="Net Weight" value={form.netWeight} onChange={handleChange} className="w-full border p-2" required />
        <input type="number" name="interestRate" placeholder="Interest Rate" value={form.interestRate} onChange={handleChange} className="w-full border p-2" required />

        <button className="w-full py-2 rounded">
          Add Pledge
        </button>
      </form>
    </div>
  );
}
