import React, { useState } from 'react';
import SettingsModal from './SettingsModal';
import ActionButtons from './ActionButtons';

const CreateLocationModal = ({ isOpen, onClose, onSave }) => {
  const [locationName, setLocationName] = useState('');

  const handleSave = async () => {
    try {
        const response = await fetch('/api/user/location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: locationName }),
          })
          const data = response.json();
          onSave(data);
          setLocationName('');
          onClose();
    }
    catch (error) {
        console.error('Error:', error);
    }
  };

return (
    <SettingsModal isModalOpen={isOpen} setIsModalOpen={onClose} modalTitle="Create Location">
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
            <label htmlFor="locationName">Location Name:</label>
            <input
                type="text"
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}
            />
        </div>
        <ActionButtons onSave={handleSave} onCancel={onClose} />
    </SettingsModal>
);
};

export default CreateLocationModal;