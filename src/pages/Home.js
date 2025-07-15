import React, { useState, useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import Chart from "chart.js/auto";

const Home = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    totalRecords: 0,
  });
  const [error, setError] = useState("");
  const monthlyChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);

  const fetchStats = async () => {
    try {
      const [usersSnapshot, locationsSnapshot, recordsSnapshot] =
        await Promise.all([
          getDocs(collection(db, "Users")),
          getDocs(collection(db, "locations")),
          getDocs(collection(db, "Records")),
        ]);

      const recordsData = recordsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.createdAt;

        return {
          ...data,
          createdAt:
            timestamp?.toDate?.() ||
            (timestamp ? new Date(timestamp) : new Date()), // Fallback to now if missing
        };
      });

      setStats({
        totalUsers: usersSnapshot.size,
        totalLocations: locationsSnapshot.size,
        totalRecords: recordsSnapshot.size,
      });

      processMonthlyChart(recordsData); // Process chart data
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard stats.");
    }
  };

  const processMonthlyChart = (records) => {
    const monthlyStats = {};

    records.forEach((record) => {
      const date =
        record.createdAt instanceof Date && !isNaN(record.createdAt)
          ? record.createdAt
          : new Date(); // Fallback to now if invalid
      const key = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }); // e.g., "Jul 2025"

      monthlyStats[key] = (monthlyStats[key] || 0) + 1;
    });

    // Sort months chronologically
    const sortedEntries = Object.entries(monthlyStats).sort((a, b) => {
      const [aMonth, aYear] = a[0].split(" ");
      const [bMonth, bYear] = b[0].split(" ");
      const aDate = new Date(`${aMonth} 1, ${aYear}`);
      const bDate = new Date(`${bMonth} 1, ${bYear}`);
      return aDate - bDate;
    });

    const labels = sortedEntries.map(([month]) => month);
    const data = sortedEntries.map(([_, count]) => count);

    renderMonthlyChart(labels, data);
  };

  const renderMonthlyChart = (labels, data) => {
    if (monthlyChartInstance.current) {
      monthlyChartInstance.current.destroy();
    }

    const ctx = monthlyChartRef.current.getContext("2d");
    monthlyChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Monthly Shipments",
            data,
            borderColor: "#2196F3",
            backgroundColor: "rgba(33, 150, 243, 0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  useEffect(() => {
    fetchStats(); // Fetch data on component mount
  }, []); // Empty dependency array ensures it runs once

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
          <h2 className="text-lg text-[#0F084B] font-semibold">
            Total Locations
          </h2>
          <p className="text-3xl text-[#0F084B] mt-2">{stats.totalLocations}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg text-[#0F084B] font-semibold">
            Total Records
          </h2>
          <p className="text-3xl text-[#0F084B] mt-2">{stats.totalRecords}</p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <a
          href="/view-records"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between"
        >
          <div>
            <h2 className="text-lg text-[#0F084B] font-semibold">
              View Records
            </h2>
            <p className="text-gray-600">Check all recorded data</p>
          </div>
          <span className="text-[#0F084B] text-2xl">→</span>
        </a>
        <a
          href="/manage-users"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between"
        >
          <div>
            <h2 className="text-lg text-[#0F084B] font-semibold">
              Manage Users
            </h2>
            <p className="text-gray-600">Add or remove users</p>
          </div>
          <span className="text-[#0F084B] text-2xl">→</span>
        </a>
      </div>

      {/* Monthly Shipments Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-lg text-[#0F084B] font-semibold mb-4">
          Monthly Shipments
        </h2>
        <canvas ref={monthlyChartRef} className="w-full h-64"></canvas>
      </div>
    </div>
  );
};

export default Home;
