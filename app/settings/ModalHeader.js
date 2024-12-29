import React from 'react';

const ModalHeader = ({ title, onClose }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">{title}</h2>
    <button className="btn btn-square btn-ghost btn-sm" onClick={onClose}>
      {/* Close icon */}
    </button>
  </div>
);

export default ModalHeader;