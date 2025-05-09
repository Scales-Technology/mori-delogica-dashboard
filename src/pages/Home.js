import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Chart from 'chart.js/auto';

const Home = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    totalRecords: 0
  });
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const fetchStats = async () => {
    try {
      const [usersSnapshot, locationsSnapshot, recordsSnapshot] = await Promise.all([
        getDocs(collection(db, 'Users')),
        getDocs(collection(db, 'locations')),
        getDocs(collection(db, 'Records'))
      ]);
      setStats({
        totalUsers: usersSnapshot.size,
        totalLocations: locationsSnapshot.size,
        totalRecords: recordsSnapshot.size
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard stats.');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy(); // Destroy previous chart instance
    }
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Users', 'Locations', 'Records'],
        datasets: [{
          label: 'Count',
          data: [stats.totalUsers, stats.totalLocations, stats.totalRecords],
          backgroundColor: '#0F084B',
          borderColor: '#0F084B',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats]);

  return (
    <div className="p-6 min-h-screen bg-[#F9F9F9] font-poppins">
      <h1 className="text-3xl font-bold text-[#0F084B] mb-6">Dashboard</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg text-[#0F084B] font-semibold">Total Users</h2>
          <p className="text-3xl text-[#0F084B] mt-2">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg text-[#0F084B] font-semibold">Total Locations</h2>
          <p className="text-3xl text-[#0F084B] mt-2">{stats.totalLocations}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg text-[#0F084B] font-semibold">Total Records</h2>
          <p className="text-3xl text-[#0F084B] mt-2">{stats.totalRecords}</p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <a href="/view-records" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
          <div>
            <h2 className="text-lg text-[#0F084B] font-semibold">View Records</h2>
            <p className="text-gray-600">Check all recorded data</p>
          </div>
          <span className="text-[#0F084B] text-2xl">→</span>
        </a>
        <a href="/manage-users" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
          <div>
            <h2 className="text-lg text-[#0F084B] font-semibold">Manage Users</h2>
            <p className="text-gray-600">Add or remove users</p>
          </div>
          <span className="text-[#0F084B] text-2xl">→</span>
        </a>
      </div>

      {/* Simple Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg text-[#0F084B] font-semibold mb-4">Activity Overview</h2>
        <canvas ref={chartRef} id="dashboardChart" className="w-full h-64"></canvas>
      </div>
    </div>
  );
};

export default Home;