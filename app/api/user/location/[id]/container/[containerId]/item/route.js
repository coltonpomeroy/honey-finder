"use client"

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import ButtonAccount from "@/components/ButtonAccount";

export default function Location() {
  const params = useSearchParams();
  const { data: session } = useSession();
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState('');
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerItems, setNewContainerItems] = useState([]);
  const [showAddContainerForm, setShowAddContainerForm] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [currentContainerId, setCurrentContainerId] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(0);

  const id = params.get('id'); // Access the 'id' query parameter

  useEffect(() => {
    if (!session || !id) return;

    const fetchLocation = async () => {
      try {
        const response = await fetch(`/api/user/location/${id}`);
        const data = await response.json();
        if (response.ok) {
          setLocation(data.location);
        } else {
          setMessage(data.message || 'Failed to fetch location');
        }
      } catch (error) {
        setMessage('Server error');
      }
    };

    fetchLocation();
  }, [session, id]);

  const handleAddContainer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/user/location/${id}/add-container`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newContainerName, items: newContainerItems }),
      });
      const data = await response.json();
      if (response.ok) {
        setLocation(data.location);
        setNewContainerName('');
        setNewContainerItems([]);
        setShowAddContainerForm(false);
      } else {
        setMessage(data.message || 'Failed to add container');
      }
    } catch (error) {
      setMessage('Server error');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/user/location/${id}/container/${currentContainerId}/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItemName, quantity: newItemQuantity }),
      });
      const data = await response.json();
      if (response.ok) {
        setLocation(data.location);
        setNewItemName('');
        setNewItemQuantity(0);
        setShowAddItemForm(false);
      } else {
        setMessage(data.message || 'Failed to add item');
      }
    } catch (error) {
      setMessage('Server error');
    }
  };

  if (!location) {
    return <p>Loading...</p>;
  }

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">{location.name}</h1>
        {message && <p>{message}</p>}
        {location.containers.length === 0 ? (
          <p>No containers... yet!</p>
        ) : (
          <ul>
            {location.containers.map((container, index) => (
              <li key={index}>
                <h2 className="text-2xl font-bold">
                  {container.name}
                  <button
                    onClick={() => {
                      setCurrentContainerId(container._id);
                      setShowAddItemForm(true);
                      setShowAddContainerForm(false);
                    }}
                    className="ml-2 p-2 bg-blue-500 text-white"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </h2>
                <ul>
                  {container.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      {item.name} - {item.quantity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => {
            setShowAddContainerForm(true);
            setShowAddItemForm(false);
          }}
          className="ml-2 p-2 bg-blue-500 text-white"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
        {showAddContainerForm && (
          <form onSubmit={handleAddContainer}>
            <FontAwesomeIcon icon={faPlus} />
            <input
              type="text"
              value={newContainerName}
              onChange={(e) => setNewContainerName(e.target.value)}
              placeholder="Container Name"
              required
              className="border p-2"
            />
            <button type="submit" className="ml-2 p-2 bg-blue-500 text-white">Add Container</button>
          </form>
        )}
        {showAddItemForm && (
          <form onSubmit={handleAddItem}>
            <h2 className="text-2xl font-bold">Add a new item</h2>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item Name"
              required
              className="border p-2"
            />
            <input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(Number(e.target.value))}
              placeholder="Quantity"
              required
              className="border p-2 ml-2"
            />
            <button type="submit" className="ml-2 p-2 bg-blue-500 text-white"><FontAwesomeIcon icon={faPlus} /></button>
          </form>
        )}
      </section>
    </main>
  );
}