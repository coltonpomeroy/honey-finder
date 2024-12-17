"use client"

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ButtonAccount from "@/components/ButtonAccount";
import Modal from "@/components/Modal";

export default function Dashboard() {
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

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
        if (response.ok) {
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

  const handleEdit = (item) => {
    setCurrentItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity);
    setModalTitle('Edit Item');
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setCurrentItem(item);
    setModalTitle('Delete Item');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setEditName('');
    setEditQuantity('');
  };

  const confirmDelete = async () => {
    if (!currentItem || !currentItem.locationId || !currentItem.containerId || !currentItem.item) {
      setMessage('Invalid item details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${currentItem.locationId}/container/${currentItem.containerId}/item/${currentItem.item}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        setItems(items.filter(item => item.item !== currentItem.item));
        closeModal();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const data = await response.json();
          setMessage(data.message || 'Failed to delete item');
        } else {
          const errorText = await response.text();
          setMessage(`Failed to delete item. Server returned: ${errorText}`);
        }
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const confirmEdit = async () => {
    if (!currentItem || !currentItem.locationId || !currentItem.containerId || !currentItem.item) {
      setMessage('Invalid item details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${currentItem.locationId}/container/${currentItem.containerId}/item/${currentItem.item}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          quantity: editQuantity,
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(item => (item.item === currentItem.item ? { ...item, ...updatedItem } : item)));
        closeModal();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const data = await response.json();
          setMessage(data.message || 'Failed to update item');
        } else {
          const errorText = await response.text();
          setMessage(`Failed to update item. Server returned: ${errorText}`);
        }
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
                <th className="px-4 py-2 border-b">Location</th>
                <th className="px-4 py-2 border-b">Container</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.item} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b">{item.name}</td>
                  <td className="px-4 py-2 border-b">{item.quantity}</td>
                  <td className="px-4 py-2 border-b">{item.expiration ? new Date(item.expiration).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-2 border-b">{item.locationName}</td>
                  <td className="px-4 py-2 border-b">{item.container}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
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

      <Modal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={closeModal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        {modalTitle === 'Delete Item' ? (
          <div>
            <p>Are you sure you want to delete this item?</p>
            <div className="mt-4 flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); confirmEdit(); }}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Item Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="flex justify-end">
                <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </main>
  );
}