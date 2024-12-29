import { useEffect, useState } from 'react';
import SettingsModal from './SettingsModal';
import ActionButtons from './ActionButtons';

const EditLocationModal = ({ isOpen, onClose, onSave, title, value }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(value);
  }, [value]);

  const handleSave = async () => {
    try {
          onSave({ name });
          setName('');
          onClose();
    }
    catch (error) {
        console.error('Error:', error);
    }
  };

return (
    <SettingsModal isModalOpen={isOpen} setIsModalOpen={onClose} modalTitle={title}>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
            <label htmlFor="editName">Edit Name:</label>
            <input
                type="text"
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}
            />
        </div>
        <ActionButtons onSave={handleSave} onCancel={onClose} />
    </SettingsModal>
);
};

export default EditLocationModal;