import React from 'react';

const SettingsModal = ({ isModalOpen, setIsModalOpen, modalTitle, children }) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => setIsModalOpen(false)}
          >
            {/* Close icon */}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default SettingsModal;