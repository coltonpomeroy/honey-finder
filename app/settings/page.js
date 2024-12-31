"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LocationsTable from './LocationTable';
import CreateLocationModal from './CreateLocationModal';
import EditLocationModal from './EditLocationModal';

export default function Settings() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationForContainer, setSelectedLocationForContainer] = useState(null);
  const [isCollectingName, setIsCollectingName] = useState(false);
  const [userName, setUserName] = useState(null);
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchLocations();
  }, [session]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  },[message])

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

  const handleLocationChange = async (location) => {
    setSelectedLocation(location);
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

  const handleCreateLocation = () => {
    setIsCreateLocationModalOpen(true)
  };

  const closeModal = () => {
    setCurrentLocation(null);
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
          </div>
            {/* Locations Table */}
            <div>
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
            </div>
        </section>
      </main>
    </Suspense>
  );
}