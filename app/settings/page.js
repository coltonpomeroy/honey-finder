"use client"

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/Modal';

export default function Settings() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState([]);
  const [containers, setContainers] = useState([]);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentContainer, setCurrentContainer] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!session) return;

    // Fetch all locations and containers on component mount
    const fetchLocationsAndContainers = async () => {
      try {
        const response = await fetch('/api/user/locations', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setLocations(data.locations);
        } else {
          setMessage(data.message || 'Failed to fetch locations');
        }
      } catch (error) {
        setMessage('Server error');
        console.error({ error });
      }
    };

    fetchLocationsAndContainers();
  }, [session]);

  const handleEditLocation = (location) => {
    setCurrentLocation(location);
    setEditName(location.name);
    setModalTitle('Edit Location');
    setIsModalOpen(true);
  };

  const handleEditContainer = (container) => {
    setCurrentContainer(container);
    setEditName(container.name);
    setModalTitle('Edit Container');
    setIsModalOpen(true);
  };

  const handleCreateLocation = () => {
    setCurrentLocation(null);
    setEditName('');
    setModalTitle('Create Location');
    setIsModalOpen(true);
  };

  const handleCreateContainer = () => {
    setCurrentContainer(null);
    setEditName('');
    setModalTitle('Create Container');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLocation(null);
    setCurrentContainer(null);
    setEditName('');
  };

  const confirmEditLocation = async () => {
    if (!currentLocation) {
      setMessage('Invalid location details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${currentLocation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
        }),
      });

      if (response.ok) {
        const updatedLocation = await response.json();
        setLocations(locations.map(location => (location.id === currentLocation.id ? updatedLocation : location)));
        closeModal();
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to update location');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const confirmEditContainer = async () => {
    if (!currentContainer) {
      setMessage('Invalid container details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${currentContainer.locationId}/container/${currentContainer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
        }),
      });

      if (response.ok) {
        const updatedContainer = await response.json();
        setContainers(containers.map(container => (container.id === currentContainer.id ? updatedContainer : container)));
        closeModal();
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to update container');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const confirmCreateLocation = async () => {
    if (!editName) {
      setMessage('Please provide a valid location name');
      return;
    }

    try {
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
        }),
      });

      if (response.ok) {
        const newLocation = await response.json();
        setLocations([...locations, newLocation]);
        closeModal();
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to create location');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const confirmCreateContainer = async () => {
    if (!editName || !currentLocation) {
      setMessage('Please provide valid container details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${currentLocation.id}/container`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
        }),
      });

      if (response.ok) {
        const newContainer = await response.json();
        setContainers([...containers, newContainer]);
        closeModal();
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to create container');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl md:text-4xl font-extrabold">Settings</h1>
        {message && <p className="text-red-500">{message}</p>}
        <div className="flex justify-between">
          <button
            onClick={handleCreateLocation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Location
          </button>
          <button
            onClick={handleCreateContainer}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Container
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Location Name</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b">{location.name}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto mt-8">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Container Name</th>
                <th className="px-4 py-2 border-b">Location</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr key={container.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b">{container.name}</td>
                  <td className="px-4 py-2 border-b">{container.locationName}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => handleEditContainer(container)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Edit
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
        <form onSubmit={(e) => { e.preventDefault(); modalTitle.includes('Location') ? (currentLocation ? confirmEditLocation() : confirmCreateLocation()) : (currentContainer ? confirmEditContainer() : confirmCreateContainer()); }}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex justify-end">
            <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
          </div>
        </form>
      </Modal>
    </main>
  );
}