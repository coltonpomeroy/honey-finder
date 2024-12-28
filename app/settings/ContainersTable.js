import React from 'react';

const ContainersTable = ({ containers, selectedContainer, setSelectedContainer }) => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold">
        Containers in {selectedContainer?.locationName}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Container Name</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {containers.map((container) => (
              <tr
                key={container.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  if (selectedContainer?.id === container.id) {
                    setSelectedContainer(null);
                  } else {
                    setSelectedContainer(container);
                  }
                }}
              >
                <td className="px-4 py-2 border-b">{container.name}</td>
                <td className="px-4 py-2 border-b">
                  {selectedContainer?.id === container.id && (
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add your edit container logic here
                        }}
                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add your delete container logic here
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContainersTable;