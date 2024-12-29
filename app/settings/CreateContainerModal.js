import React, { useState } from 'react';
import SettingsModal from './SettingsModal';
import ActionButtons from './ActionButtons';

const CreateContainerModal = ({ isOpen, onClose, onSave, locations }) => {
  const [containerName, setContainerName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/user/location/${selectedLocation}/container`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: containerName, location: selectedLocation }),
      });
      const data = await response.json();
      onSave(data);
      setContainerName('');
      setSelectedLocation('');
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <SettingsModal isModalOpen={isOpen} setIsModalOpen={onClose} modalTitle="Create Container">
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
        <label htmlFor="containerLocationName">Location Name:</label>  
        <select id="containerLocationName" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
            <option value="" disabled>Select Location</option>
            {locations.map((location) => (
            <option key={location.id} value={location.id}>{location.name}</option>
            ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
            <label htmlFor="containerName">Container Name:</label>
            <input
                type="text"
                id="containerName"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}
            />
        </div>
      <ActionButtons onSave={handleSave} onCancel={onClose} />
    </SettingsModal>
  );
};

export default CreateContainerModal;