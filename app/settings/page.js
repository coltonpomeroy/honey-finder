"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LocationsTable from './LocationTable';
import ContainersTable from './ContainersTable';
import CreateLocationModal from './CreateLocationModal';
import CreateContainerModal from './CreateContainerModal';
import { set } from 'mongoose';
import EditLocationModal from './EditLocationModal';
import EditContainerModal from './EditContainerModal';

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
  const [isCreateContainerModalOpen, setIsCreateContainerModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [isEditContainerModalOpen, setIsEditContainerModalOpen] = useState(false);

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
    console.log({selectedLocation})
  },[selectedLocation])

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

  const fetchContainers = async (locationId) => {
    try {
      const response = await fetch(`/api/user/location/${locationId}/containers`, {
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

  const handleLocationChange = async (location) => {
    if (selectedLocation?.id === location.id) {
      setSelectedLocation(null);
      setContainers([]);
    } else {
      setSelectedLocation(location);
      setSelectedContainer(null);
      try {
        await fetchContainers(location.id);
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
    setIsEditLocationModalOpen(true);
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
    setIsEditContainerModalOpen(true);
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
    setIsCreateContainerModalOpen(true)
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLocation(null);
    setCurrentContainer(null);
    setEditName('');
    setSelectedLocationForContainer(null);
  };

  const confirmEditLocation = async (data) => {
    setMessage('');
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
        body: JSON.stringify({ name: data.name }),
      });

      if (response.ok) {
        fetchLocations()
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

  const confirmEditContainer = async (data) => {
    setMessage('');
    if (!currentContainer) {
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
          body: JSON.stringify({ name: data.name }),
        }
      );

      if (response.ok) {
        fetchContainers(selectedLocation.id);
        closeModal();
      } else {
        setMessage(data.message || 'Failed to update container');
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  }

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
            <CreateContainerModal
              isOpen={isCreateContainerModalOpen}
              onClose={() => setIsCreateContainerModalOpen(false)}
              onSave={handleCreateContainer}
              locations={locations}
            />
          </div>
            {/* Locations Table */}
            <LocationsTable
              locations={locations}
              selectedLocation={selectedLocation}
              handleLocationChange={handleLocationChange}
              handleEditLocation={handleEditLocation}
              handleDeleteLocation={handleDeleteLocation}
            />
            <EditLocationModal 
              isOpen={isEditLocationModalOpen}
              onClose={() => setIsEditLocationModalOpen(false)}
              onSave={data => confirmEditLocation(data)}
              title={`Edit Location: ${currentLocation?.name || ''}`}
              value={currentLocation?.name || ""}
            />

            {/* Containers Table */}
            {selectedLocation && containers.length > 0 && (
              <>
                  <ContainersTable
                    selectedLocation={selectedLocation.name}
                    containers={containers}
                    selectedContainer={selectedContainer}
                    setSelectedContainer={setSelectedContainer}
                    handleEditContainer={handleEditContainer}
                    handleDeleteContainer={handleDeleteContainer}
                  />
                  <EditContainerModal 
                    isOpen={isEditContainerModalOpen}
                    onClose={() => setIsEditContainerModalOpen(false)}
                    onSave={data => confirmEditContainer(data)}
                    title={modalTitle}
                    value={editName}
                  />
              </>
          )}
        </section>
      </main>
    </Suspense>
  );
}