"use client"

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ButtonAccount from "@/components/ButtonAccount";

export default function Dashboard() {
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session) return;

    // Fetch all items on component mount
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/user/items', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });
        const data = await response.json();
        if (response) {
          setItems(data.items);
        } else {
          setMessage(data.message || 'Failed to fetch items');
        }
      } catch (error) {
        setMessage('Server error');
        console.error({ error });
      }
    };

    fetchItems();
  }, [session]);

  const handleEdit = (itemId) => {
    // Handle edit item logic
    console.log(`Edit item with ID: ${itemId}`);
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/user/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (response.ok) {
        setItems(items.filter(item => item.item !== itemId));
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to delete item');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-6xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
        {message && <p className="text-red-500">{message}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Item Name</th>
                <th className="px-4 py-2 border-b">Quantity</th>
                <th className="px-4 py-2 border-b">Expiration Date</th>
                <th className="px-4 py-2 border-b">Container</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.item} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b">{item.name}</td>
                  <td className="px-4 py-2 border-b">{item.quantity}</td>
                  <td className="px-4 py-2 border-b">{item.expiration ? new Date(item.expiration).toLocaleDateString() : ''}</td>
                  <td className="px-4 py-2 border-b">{item.container}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => handleEdit(item.item)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.item)}
                      className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}