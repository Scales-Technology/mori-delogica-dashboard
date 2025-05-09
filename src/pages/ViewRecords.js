import React, { useEffect, useState } from 'react';
import { db, getUserRole } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { CSVLink } from 'react-csv';

const ViewRecords = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          const userRole = await getUserRole(user.uid);
          setRole(userRole);
        }

        const recordsRef = collection(db, 'Records');
        const snapshot = await getDocs(recordsRef);
        const recordsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecords(recordsData);
        setFilteredRecords(recordsData);
      } catch (error) {
        console.error('Error fetching records:', error);
        alert('Failed to load records');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);
    const filtered = records.filter((record) =>
      record.awbnumber?.toLowerCase().includes(value) ||
      record.destination?.toLowerCase().includes(value) ||
      record.paymentStatus?.toLowerCase().includes(value)
    );
    setFilteredRecords(filtered);
  };

  const handleDelete = async (recordId) => {
    if (role !== 'admin') {
      alert('Only admins can delete records');
      return;
    }
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, 'Records', recordId));
        setRecords(records.filter((record) => record.id !== recordId));
        setFilteredRecords(filteredRecords.filter((record) => record.id !== recordId));
        alert('Record deleted successfully');
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  const csvData = filteredRecords.map((record) => ({
    AWBNumber: record.awbnumber,
    Destination: record.destination,
    TotalWeight: `${record.totalWeight} kg`,
    PaymentStatus: record.paymentStatus,
    CreatedAt: record.createdAt?.seconds
      ? new Date(record.createdAt.seconds * 1000).toLocaleDateString()
      : 'Unknown',
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F9] font-poppins p-6">
      <h1 className="text-3xl font-bold text-[#0F084B] mb-6">Records Management</h1>
      {loading ? (
        <p className="text-center text-[#666]">Loading...</p>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <input
              type="text"
              placeholder="Filter by AWB, destination, or payment status"
              value={filter}
              onChange={handleFilterChange}
              className="w-1/2 p-3 border border-[#ddd] rounded-lg font-poppins text-[#333]"
            />
            <CSVLink
              data={csvData}
              filename="records_export.csv"
              className="bg-[#0F084B] text-white px-4 py-2 rounded-lg hover:bg-[#1a167d]"
            >
              Export to CSV
            </CSVLink>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-[#ddd] rounded-lg">
              <thead>
                <tr className="bg-[#0F084B] text-white">
                  <th className="p-3 text-left font-poppins">AWB Number</th>
                  <th className="p-3 text-left font-poppins">Destination</th>
                  <th className="p-3 text-left font-poppins">Total Weight (kg)</th>
                  <th className="p-3 text-left font-poppins">Payment Status</th>
                  <th className="p-3 text-left font-poppins">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-[#ddd] hover:bg-[#f5f5f5]">
                      <td className="p-3 text-[#333]">{record.awbnumber}</td>
                      <td className="p-3 text-[#333]">{record.destination}</td>
                      <td className="p-3 text-[#333]">{record.totalWeight || 0} kg</td>
                      <td className="p-3 text-[#333]">{record.paymentStatus}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-[#0F084B] hover:underline mr-2"
                        >
                          View
                        </button>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center text-[#666]">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedRecord && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/2">
                <h2 className="text-2xl font-bold text-[#0F084B] mb-4">Record Details</h2>
                <p><strong>AWB Number:</strong> {selectedRecord.awbnumber}</p>
                <p><strong>Destination:</strong> {selectedRecord.destination}</p>
                <p><strong>Total Weight:</strong> {selectedRecord.totalWeight || 0} kg</p>
                <p><strong>Payment Status:</strong> {selectedRecord.paymentStatus}</p>
                <p><strong>Shipper:</strong> {selectedRecord.shipper}</p>
                <p><strong>Created At:</strong> {selectedRecord.createdAt?.seconds
                  ? new Date(selectedRecord.createdAt.seconds * 1000).toLocaleString()
                  : 'Unknown'}</p>
                <div className="mt-4">
                  <h3 className="font-semibold text-[#333]">Sender Details</h3>
                  <p>Name: {selectedRecord.senderDetails?.name}</p>
                  <p>Phone: {selectedRecord.senderDetails?.phone}</p>
                  <p>ID: {selectedRecord.senderDetails?.idNumber}</p>
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-[#333]">Receiver Details</h3>
                  <p>Name: {selectedRecord.receiverDetails?.name}</p>
                  <p>Phone: {selectedRecord.receiverDetails?.phone}</p>
                  <p>ID: {selectedRecord.receiverDetails?.idNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="mt-4 bg-[#0F084B] text-white px-4 py-2 rounded-lg hover:bg-[#1a167d]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewRecords;