"use client";

const Modal = ({ isModalOpen, setIsModalOpen, children }) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsModalOpen(false)}></div>
      <div className="bg-white rounded-lg shadow-lg p-6 z-10 max-w-lg w-full">
        {children}
      </div>
    </div>
  );
};

export default Modal;