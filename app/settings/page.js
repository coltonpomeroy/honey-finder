"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LocationsTable from './LocationTable';
import ContainersTable from './ContainersTable';
import CreateLocationModal from './CreateLocationModal';

export default function Settings() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isCollectingName, setIsCollectingName] = useState(false);
  const [userName, setUserName] = useState(null);
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchLocations();
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const setup = searchParams.get('setup');
    if (setup === 'true' && !session.user.name) {
      setIsModalOpen(true);
      setIsCollectingName(true);
      setModalTitle('Welcome! Please enter your name');
    } else if (setup === 'true') {
      setIsModalOpen(true);
      setModalTitle(`Welcome to PantryPal, ${session.user.name}!`);
    }
  }, [session, searchParams]);

  useEffect(() => {
    setModalTitle(`Welcome to PantryPal, ${userName}!`);
  },[userName]);

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

  const handleNameSubmit = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName }),
      });
      const data = await response.json();
      // setIsModalOpen(false);
      setUserName(data.name);
      setIsCollectingName(false);
      setMessage('Name updated successfully');
    } catch (error) {
      console.error('Error updating name:', error);
      setMessage('Failed to update name');
    }
  };

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
    setIsCreateLocationModalOpen(true)
  };

  const handleCreateContainer = () => {
    setCurrentContainer(null);
    setEditName('');
    setModalTitle('Create Container');
    setSelectedLocationForContainer(selectedLocation?.id || null); // Ensure ID is set
    setIsModalOpen(true);
  };

  const handleFinish = async () => {
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setupCompleted: true }),
      });
      setIsModalOpen(false);
      setMessage('Setup completed successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing setup:', error);
      setMessage('Failed to complete setup');
    }
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
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">Settings</h1>
          <Link href="/dashboard" legacyBehavior>Back to Dashboard</Link>
          {message && <p className="text-red-500">{message}</p>}
          <div className="flex justify-between">
            <button
              onClick={handleCreateLocation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Location
            </button>
            <CreateLocationModal
              isOpen={isCreateLocationModalOpen}
              onClose={() => {
                setIsCreateLocationModalOpen(false)
                fetchLocations()
              }}
              onSave={handleCreateLocation}
            />
            <button
              onClick={handleCreateContainer}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Container
            </button>
          </div>
            {/* Locations Table */}
            <LocationsTable
              locations={locations}
              selectedLocation={selectedLocation}
              handleLocationChange={handleLocationChange}
              handleEditLocation={handleEditLocation}
              handleDeleteLocation={handleDeleteLocation}
            />

            {/* Containers Table */}
            {selectedLocation && containers.length > 0 && (
            <ContainersTable
              containers={containers}
              selectedContainer={selectedContainer}
              setSelectedContainer={setSelectedContainer}
            />
          )}
        </section>
      </main>
    </Suspense>
  );
}