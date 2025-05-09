import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [error, setError] = useState('');

  // Fetch existing locations
  const fetchLocations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'locations'));
      const locationList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locationList);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations.');
    }
  };

  // Add a new location
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) {
      setError('Location name cannot be empty.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'locations'), {
        name: newLocation,
        createdAt: new Date().toISOString()
      });
      console.log('Location added with ID:', docRef.id);
      setNewLocation(''); // Clear input
      setError('');
      fetchLocations(); // Refresh the list
    } catch (err) {
      console.error('Error adding location:', err);
      setError('Failed to add location.');
    }
  };

  // Delete a location
  const handleDeleteLocation = async (id) => {
    try {
      await deleteDoc(doc(db, 'locations', id));
      fetchLocations(); // Refresh the list
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location.');
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#0F084B] mb-6">Manage Locations</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {/* Form to add a new location */}
      <form onSubmit={handleAddLocation} className="mb-6">
        <input
          type="text"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="Enter location name"
          className="p-3 border border-[#ddd] rounded-lg font-poppins text-[#333] mr-4"
        />
        <button
          type="submit"
          className="py-3 px-6 bg-[#0F084B] text-white rounded-lg hover:bg-[#1a167d] transition-colors"
        >
          Add Location
        </button>
      </form>

      {/* List of locations */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0F084B] text-white">
              <th className="p-3 text-left">Location Name</th>
              <th className="p-3 text-left">Created At</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className="border-b">
                <td className="p-3">{location.name}</td>
                <td className="p-3">{new Date(location.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="py-1 px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageLocations;