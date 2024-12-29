import React from 'react';

const VideoSection = ({ onFinish }) => (
  <div className="mb-4">
    <iframe
      width="100%"
      height="auto"
      src="https://www.youtube.com/embed/ZXsQAXx_ao0"
      title="Welcome to PantryPal"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
    <div className="flex justify-end mt-4">
      <button onClick={onFinish} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Finish
      </button>
    </div>
  </div>
);

export default VideoSection;