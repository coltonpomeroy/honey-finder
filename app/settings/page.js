"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/Modal';
import Link from 'next/link';

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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [selectedLocationForContainer, setSelectedLocationForContainer] = useState(null);

  useEffect(() => {
    if (!session) return;

    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/user/locations', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
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

    fetchLocations();
  }, [session]);

  const handleLocationChange = async (location) => {
    if (selectedLocation?.id === location.id) {
      setSelectedLocation(null);
      setContainers([]);
    } else {
      setSelectedLocation(location);
      setSelectedContainer(null);
      try {
        const response = await fetch(`/api/user/location/${location.id}/containers`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setContainers(data.containers);
        } else {
          setMessage(data.message || 'Failed to fetch containers');
        }
      } catch (error) {
        setMessage('Server error');
        console.error({ error });
      }
    }
  };

  const handleEditLocation = (location) => {
    setCurrentLocation(location);
    setEditName(location.name);
    setModalTitle('Edit Location');
    setIsModalOpen(true);
  };

  const handleDeleteLocation = async (location) => {
    try {
      const response = await fetch(`/api/user/location/${location.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (response.ok) {
        setLocations(locations.filter((loc) => loc.id !== location.id));
        setSelectedLocation(null);
        setMessage('Location deleted successfully');
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to delete location');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const handleEditContainer = (container) => {
    setCurrentContainer(container);
    setEditName(container.name);
    setModalTitle('Edit Container');
    setIsModalOpen(true);
  };

  const handleDeleteContainer = async (container) => {
    try {
      const response = await fetch(
        `/api/user/location/${selectedLocation.id}/container/${container.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setContainers(data.containers);
        setMessage('Container deleted successfully');
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to delete container');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
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
    setSelectedLocationForContainer(selectedLocation?.id || null); // Ensure ID is set
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLocation(null);
    setCurrentContainer(null);
    setEditName('');
    setSelectedLocationForContainer(null);
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
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocations([...locations, data.location]);
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

  const confirmEditLocation = async () => {
    if (!currentLocation) {
      setMessage('Invalid location details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${currentLocation.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocations(
          locations.map((location) =>
            location.id === currentLocation.id ? data.location : location
          )
        );
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

  const confirmCreateContainer = async () => {
    if (!editName || !selectedLocationForContainer) {
      setMessage('Please provide valid container details');
      return;
    }

    try {
      const response = await fetch(
        `/api/user/location/${selectedLocationForContainer}/container`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editName,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.location.containers) {
          setContainers([...containers, data.location.containers]);
          closeModal();
        } else {
          setMessage('Failed to create container: Invalid response from server');
        }
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to create container');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const confirmEditContainer = async () => {
    if (!currentContainer || !selectedLocation) {
      setMessage('Invalid container details');
      return;
    }

    try {
      const response = await fetch(
        `/api/user/location/${selectedLocation.id}/container/${currentContainer.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editName,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContainers(
          containers.map((container) =>
            container.id === currentContainer.id ? data.container : container
          )
        );
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

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl md:text-4xl font-extrabold">Settings</h1>
        <Link href="/dashboard" legacyBehavior>Back to Dashbaord</Link>
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
        <Suspense fallback={<div>Loading...</div>}>
          {/* Locations Table */}
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
                  <tr
                    key={location.id}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleLocationChange(location)}
                  >
                    <td className="px-4 py-2 border-b">{location.name}</td>
                    <td className="px-4 py-2 border-b">
                      {selectedLocation?.id === location.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLocation(location);
                            }}
                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLocation(location);
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Containers Table */}
          {selectedLocation && containers.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold">
                Containers in {selectedLocation.name}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Container Name</th>
                      <th className="px-4 py-2 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {containers.map((container) => (
                      <tr
                        key={container.id}
                        className="hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          if (selectedContainer?.id === container.id) {
                            setSelectedContainer(null);
                          } else {
                            setSelectedContainer(container);
                          }
                        }}
                      >
                        <td className="px-4 py-2 border-b">{container.name}</td>
                        <td className="px-4 py-2 border-b">
                          {selectedContainer?.id === container.id && (
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditContainer(container);
                                }}
                                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteContainer(container);
                                }}
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Suspense>
      </section>

      <Modal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={closeModal}
          >
            {/* Close icon */}
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (modalTitle === 'Create Location') {
              confirmCreateLocation();
            } else if (modalTitle === 'Edit Location') {
              confirmEditLocation();
            } else if (modalTitle === 'Create Container') {
              confirmCreateContainer();
            } else if (modalTitle === 'Edit Container') {
              confirmEditContainer();
            }
          }}
        >
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="name"
            >
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

          {modalTitle === 'Create Container' && (
            <div className="mb-4">
              <label
                htmlFor="location"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Select Location
              </label>
              <select
                id="location"
                value={selectedLocationForContainer || ''}
                onChange={(e) =>
                  setSelectedLocationForContainer(e.target.value)
                }
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="" disabled>
                  -- Select a Location --
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}