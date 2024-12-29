import React from 'react';

const ActionButtons = ({ onSave, onCancel }) => (
  <div className="flex justify-end mt-4">
    <button onClick={onSave} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Save
    </button>
    <button onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2">
      Cancel
    </button>
  </div>
);

export default ActionButtons;