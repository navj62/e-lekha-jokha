// FRONTEND: app/customers/page.tsx
"use client";

import { useEffect, useState } from "react";

const filterOptions = [
  { value: "all", label: "All Fields" },
  { value: "name", label: "Name" },
  { value: "address", label: "Address" },
  { value: "itemName", label: "Item Name" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "RELEASED", label: "Released" },
  { value: "OVERDUE", label: "Overdue" },
];

type Customer = {
  id: string;
  name: string;
  pledgeCount: number;
  latestItem: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (filter) query.set("filter", filter);
    if (status) query.set("status", status);

    const res = await fetch(`/api/customers/search?${query.toString()}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCustomers();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 border p-2 rounded min-w-[200px]"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {(filter === "itemName" || filter === "all") && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 rounded"
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:opacity-90"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <ul className="space-y-4">
          {customers.map((cust) => (
            <li key={cust.id} className="border p-4 rounded shadow-sm bg-white">
              <h2 className="font-semibold text-lg">{cust.name}</h2>
              <p className="text-sm text-gray-500">
                Pledges: {cust.pledgeCount}
              </p>
              <p className="text-sm text-gray-500">
                Latest Item: {cust.latestItem || "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}