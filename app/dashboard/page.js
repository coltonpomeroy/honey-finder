"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session) return;
    // Fetch locations on component mount
    const fetchLocations = async () => {
      console.log({ session })
      try {
        const response = await fetch('/api/user/location');
        const data = await response.json();
        if (response.ok) {
          setLocations(data.location);
        } else {
          setMessage(data.message || 'Failed to fetch locations');
        }
      } catch (error) {
        setMessage('Server error');
        console.error({ error })
      }
    };

    fetchLocations();
  }, [session]);

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ location: { name: newLocation, containers: [] } }),
      });
      const data = await response.json();
      if (response.ok) {
        setLocations(data.location);
        setNewLocation('');
        setMessage('Location created successfully');
      } else {
        setMessage(data.message || 'Failed to create location');
      }
    } catch (error) {
      setMessage('Server error');
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Private Page</h1>
        <form onSubmit={handleCreateLocation}>
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="New Location"
            required
            className="border p-2"
          />
          <button type="submit" className="ml-2 p-2 bg-blue-500 text-white">Create Location</button>
        </form>
        {message && <p>{message}</p>}
        <ul>
          {locations.map((location, index) => (
            <li key={index}>{location.name}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}