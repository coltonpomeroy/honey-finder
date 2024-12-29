import React from 'react';

const NameInput = ({ value, onChange }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange} 
    />
  );
};

export default NameInput;