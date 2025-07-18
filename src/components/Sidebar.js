import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import {
  FaHome,
  FaTable,
  FaMapMarkerAlt,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out");
    }
  };

  return (
    <div className="fixed w-64 h-screen bg-[#F9F9F9] shadow-lg font-poppins">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[#0F084B] mb-8">
          Mori Delogica
        </h2>
        <nav>
          <Link
            to="/"
            className="block py-3 px-4 mb-2 text-[#0F084B] hover:bg-[#0F084B] hover:text-white rounded-lg transition-colors flex items-center"
          >
            <FaHome className="mr-2 text-lg" />
            Dashboard
          </Link>
          <Link
            to="/view-records"
            className="block py-3 px-4 mb-2 text-[#0F084B] hover:bg-[#0F084B] hover:text-white rounded-lg transition-colors flex items-center"
          >
            <FaTable className="mr-2 text-lg" />
            View Records
          </Link>
          <Link
            to="/manage-locations"
            className="block py-3 px-4 mb-2 text-[#0F084B] hover:bg-[#0F084B] hover:text-white rounded-lg transition-colors flex items-center"
          >
            <FaMapMarkerAlt className="mr-2 text-lg" />
            Manage Locations
          </Link>
          <Link
            to="/manage-users"
            className="block py-3 px-4 mb-2 text-[#0F084B] hover:bg-[#0F084B] hover:text-white rounded-lg transition-colors flex items-center"
          >
            <FaUsers className="mr-2 text-lg" />
            Manage Users
          </Link>
        </nav>
      </div>
      <div className="absolute bottom-6 w-64 p-6">
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-[#0F084B] text-white rounded-lg hover:bg-[#1a167d] transition-colors flex items-center justify-center"
        >
          <FaSignOutAlt className="mr-2 text-lg" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
