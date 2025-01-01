"use client"

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ButtonAccount from "@/components/ButtonAccount";
import Modal from "@/components/Modal";
import { Html5QrcodeScanner } from 'html5-qrcode';
import Fuse from 'fuse.js';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editExpirationDate, setEditExpirationDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedContainer, setSelectedContainer] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);
  const [showActions, setShowActions] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);


  useEffect(() => {
    if (!session) return;

    // Fetch all items on component mount
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/user/items', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setItems(data.items);
        } else {
          setMessage(data.message || 'Failed to fetch items');
        }
      } catch (error) {
        setMessage('Server error');
        console.error({ error });
      }
    };

    fetchItems();
  }, [session, router, isModalOpen]);

  useEffect(() => {
    if (!session) return;

    // Fetch all locations on component mount
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/user/locations', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setLocations(data.locations);
        } else {
          setMessage(data.message || 'Failed to fetch locations');
        }
      } catch (error) {
        setMessage('Server error');
        console.error({ error });
      }
    };

    fetchLocations();
  }, [session]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (searchQuery) {
      const fuse = new Fuse(items, {
        keys: ['name'],
        threshold: 0.5, // Adjust the threshold as needed
      });
      const result = fuse.search(searchQuery);
      setFilteredItems(result.map(({ item }) => item));
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

  const handleEdit = (item) => {
    setCurrentItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity);
    setEditExpirationDate(item.expiration ? new Date(item.expiration).toISOString().split('T')[0] : '');
    setSelectedLocation(item.locationId);
    setSelectedContainer(item.containerId);
    setModalTitle('Edit Item');
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setCurrentItem(item);
    setModalTitle('Delete Item');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setCurrentItem(null);
    setEditName('');
    setEditQuantity(1);
    setEditExpirationDate('');
    setSelectedLocation('');
    setSelectedContainer('');
    setScannedBarcode('');
    setModalTitle('Create Item');
    setIsModalOpen(true);
    setShowScanner(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setEditName('');
    setEditQuantity(1);
    setEditExpirationDate('');
    setSelectedLocation('');
    setSelectedContainer('');
    setScannedBarcode('');
    setShowScanner(false);
    setMessage('');
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  const confirmDelete = async () => {
    if (!currentItem || !currentItem.locationId || !currentItem.item) {
      setMessage('Invalid item details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${currentItem.locationId}/${currentItem.item}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        setItems(items.filter(item => item.item !== currentItem.item));
        closeModal();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const data = await response.json();
          setMessage(data.message || 'Failed to delete item');
        } else {
          const errorText = await response.text();
          setMessage(`Failed to delete item. Server returned: ${errorText}`);
        }
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const confirmEdit = async () => {
    if (!currentItem || !selectedLocation || !currentItem.item) {
      setMessage('Invalid item details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${selectedLocation}/${currentItem.item}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          quantity: editQuantity,
          expirationDate: editExpirationDate,
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(item => (item.item === currentItem.item ? { ...item, ...updatedItem } : item)));
        closeModal();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const data = await response.json();
          setMessage(data.message || 'Failed to update item');
        } else {
          const errorText = await response.text();
          setMessage(`Failed to update item. Server returned: ${errorText}`);
        }
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const confirmCreate = async (addAnother = false) => {
    if (!editName || !editQuantity || !selectedLocation ) {
      setMessage('Please provide valid item details');
      return;
    }

    try {
      const response = await fetch(`/api/user/location/${selectedLocation}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          quantity: editQuantity,
          expirationDate: editExpirationDate,
          barcode: scannedBarcode,
        }),
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems([...items, newItem]);
        if (addAnother) {
          setEditName('');
          setEditQuantity(1);
          setEditExpirationDate('');
          setScannedBarcode('');
          setShowScanner(true);
        } else {
          closeModal();
        }
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const data = await response.json();
          setMessage(data.message || 'Failed to create item');
        } else {
          const errorText = await response.text();
          setMessage(`Failed to create item. Server returned: ${errorText}`);
        }
      }
    } catch (error) {
      setMessage('Server error');
      console.error({ error });
    }
  };

  const handleLocationChange = async (e) => {
    const locationId = e.target.value;
    setSelectedLocation(locationId);
    setSelectedContainer('');
  };

  const getRecipeSuggestions = async () => {
    setIsLoadingRecipes(true);
    try {
      const response = await fetch('/api/webhook/openai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setRecipes(data.data);
      } else {
        setMessage(data.message || 'Failed to get recipes');
      }
    } catch (error) {
      setMessage('Error getting recipes');
      console.error({ error });
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  useEffect(() => {
    console.log('Scanner effect running, showScanner:', showScanner);
    if (showScanner) {
      const scannerElement = document.getElementById("scanner");
      if (scannerElement) {
        const scanner = new Html5QrcodeScanner(
          "scanner",
          { fps: 10, qrbox: 250 },
          /* verbose= */ false
        );
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      }
    }
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Failed to clear scanner:", error);
        } finally {
          scannerRef.current = null;
        }
      }
    };
  }, [showScanner]);
  

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (scannedBarcode.length > 0) { // Fixed condition
        setMessage('');
        try {
          const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${scannedBarcode}.json`);
          const data = await response.json();
          if (data.status === 1) {
            const brand = data.product.brands;
            const productName = data.product.product_name;
            setEditName(`${brand} - ${productName}`);
            setShowScanner(false);
          } else {
            setMessage('Product not found. Please enter manually.'); 
            setShowScanner(false);
          }
        } catch (error) {
          setMessage('Error fetching product details');
          console.error({ error });
        }
      }
    };
  
    fetchProductDetails();
  }, [scannedBarcode]);

  const onScanSuccess = (decodedText, decodedResult) => {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    setScannedBarcode(decodedText);
  };

  const onScanFailure = (error) => {
    console.warn(`Scan failed: ${error}`);
  };

  const itemsArray = searchQuery ? filteredItems : items;

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-6xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
        {message && <p className="text-red-500">{message}</p>}
        <div className="flex gap-4"> {/* Changed from space-x-4 to gap-4 for better spacing */}
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Item
          </button>
          <button
            onClick={getRecipeSuggestions}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Get Recipe Ideas
          </button>
        </div>
        <div className="overflow-x-auto">
           {/* RECIPE SUGGESTIONS */}
           {isLoadingRecipes ? (
              <div className="text-center">Loading recipes...</div>
            ) : recipes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Recipe Suggestions</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {recipes.map((recipe, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-xl font-bold mb-3">{recipe.title}</h3>
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Ingredients:</h4>
                        <ul className="list-disc pl-5">
                          {recipe.ingredients.map((ingredient, i) => (
                            <li key={i}>{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Instructions:</h4>
                        <ol className="list-decimal pl-5">
                          {recipe.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="text-green-600 font-semibold">
                        Food waste prevented: {recipe.costSavings}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <br/>
            <br/>
          <div className="min-w-full bg-white border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-100 p-4">
              <div className="font-bold">Item Name</div>
            </div>
            {/* ITEMS TABLE */}
            {itemsArray.map((item) => (
              <div
                key={item.item}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b cursor-pointer"
                onClick={() => setShowActions((prev) => ({ ...prev, [item.item]: !prev[item.item] }))}
              >
                <div>
                  <div>{item.name}</div>
                  <div>{item.expirationDate}</div>
                  {/* At the time this code was written, no expiration date is in data as expiring in the year 9999
                    This code checks if the first digit of the expiration date is not 9, and if so, it will display the expiration date
                  */ }
                  {item.expiration && item.expiration[0] < 9 && (
                    <div className={`text-sm font-medium mt-1 ${
                      new Date(item.expiration) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                    }`}>
                      Expires: {new Date(item.expiration).toLocaleDateString()}
                    </div>
                  )}
                  {showActions[item.item] && (
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={closeModal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        {modalTitle === 'Delete Item' ? (
          <div>
            <p>Are you sure you want to delete this item?</p>
            <div className="mt-4 flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            </div>
          </div>
        ) : (
          <div>
            {showScanner ? (
              <div className="mb-4">
                <div id="scanner" style={{ width: '100%' }}></div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => setShowScanner(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Enter Manually</button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); modalTitle === 'Edit Item' ? confirmEdit() : confirmCreate(); }}>
                { message && <p className="text-red-500">{message}</p> }
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expirationDate">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="expirationDate"
                    value={editExpirationDate}
                    onChange={(e) => setEditExpirationDate(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                    Location
                  </label>
                  <select
                    id="location"
                    value={selectedLocation}
                    onChange={handleLocationChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select a location</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                  <button type="button" onClick={() => confirmCreate(true)} className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save and Add Another</button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}