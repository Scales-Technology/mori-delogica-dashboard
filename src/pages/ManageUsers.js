import React, { useState, useEffect } from "react";
import { db, auth } from "../config/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user",
    name: "",
  });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ email: "", role: "", name: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Users"));
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
      console.log("Fetched users:", userList); // Debug log
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      setError("Email, password, and name are required.");
      return;
    }
    if (newUser.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      await updateProfile(userCredential.user, { displayName: newUser.name });
      await setDoc(doc(db, "Users", userCredential.user.uid), {
        email: newUser.email,
        role: newUser.role,
        uid: userCredential.user.uid,
        name: newUser.name,
        initialPassword: newUser.password, // Temporarily store password (insecure)
      });
      console.log(
        `User created: ${newUser.email}, Password: ${newUser.password}`
      );
      setNewUser({ email: "", password: "", role: "user", name: "" });
      setError("");
      fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      let errorMessage = "Failed to create user.";
      switch (err.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already in use.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email format.";
          break;
        default:
          errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser || !editForm.email || !editForm.role || !editForm.name) {
      setError("Email, role, and name are required for update.");
      return;
    }
    try {
      await updateDoc(doc(db, "Users", editUser.id), {
        email: editForm.email,
        role: editForm.role,
        name: editForm.name,
      });
      setEditUser(null);
      setEditForm({ email: "", role: "", name: "" });
      setError("");
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user: " + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "Users", id));
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user.");
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setEditForm({ email: user.email, role: user.role, name: user.name });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isAdmin = true; // Replace with actual auth check, e.g., auth.currentUser?.role === 'admin'

  return (
    <div className="p-6 min-h-screen bg-[#F9F9F9] font-poppins">
      <h1 className="text-3xl font-bold text-[#0F084B] mb-6">Manage Users</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl text-[#0F084B] font-semibold mb-4 flex justify-between items-center">
          Add New User
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="text-[#0F084B] hover:text-[#1a167d] transition-colors"
          >
            {isFormOpen ? "−" : "+"}
          </button>
        </h2>
        <form
          onSubmit={handleCreateUser}
          className="space-y-4"
          style={{ display: isFormOpen ? "block" : "none" }}
        >
          <input
            type="text"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Name"
            className="w-full p-3 border border-[#ddd] rounded-lg"
            required
          />
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Email"
            className="w-full p-3 border border-[#ddd] rounded-lg"
            required
          />
          <input
            type="password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            placeholder="Password"
            className="w-full p-3 border border-[#ddd] rounded-lg"
            required
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="w-full p-3 border border-[#ddd] rounded-lg"
          >
            <option value="warehouse_staff">warehouse_staff</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            className="w-full py-3 bg-[#0F084B] text-white rounded-lg hover:bg-[#1a167d] transition-colors"
          >
            Add User
          </button>
        </form>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter by name..."
          onChange={(e) => {
            const filterValue = e.target.value.toLowerCase();
            const filteredUsers = users.filter(
              (user) =>
                user.name && user.name.toLowerCase().includes(filterValue)
            );
            setUsers([...filteredUsers]);
          }}
          className="p-3 border border-[#ddd] rounded-lg w-full md:w-1/3"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-[#ddd]">
          <thead>
            <tr className="bg-[#0F084B] text-white">
              <th className="p-3 text-left border border-[#ddd]">Name</th>
              <th className="p-3 text-left border border-[#ddd]">Email</th>
              <th className="p-3 text-left border border-[#ddd]">Role</th>
              {isAdmin && (
                <th className="p-3 text-left border border-[#ddd]">Password</th>
              )}
              <th className="p-3 text-left border border-[#ddd]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-b border-[#ddd]">
                  <td className="p-3 border border-[#ddd]">
                    {editUser && editUser.id === user.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full p-2 border border-[#ddd] rounded"
                      />
                    ) : (
                      user.name || "N/A"
                    )}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    {editUser && editUser.id === user.id ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full p-2 border border-[#ddd] rounded"
                      />
                    ) : (
                      user.email || "N/A"
                    )}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    {editUser && editUser.id === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) =>
                          setEditForm({ ...editForm, role: e.target.value })
                        }
                        className="w-full p-2 border border-[#ddd] rounded"
                      >
                        <option value="warehouse_staff">warehouse_staff</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      user.role || "N/A"
                    )}
                  </td>
                  {isAdmin && (
                    <td className="p-3 border border-[#ddd]">
                      {user.initialPassword || "Not available"}
                    </td>
                  )}
                  <td className="p-3 border border-[#ddd]">
                    {editUser && editUser.id === user.id ? (
                      <button
                        onClick={handleUpdateUser}
                        className="py-1 px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-2 transition-colors"
                      >
                        Save
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          className="py-1 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mr-2 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="py-1 px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
                  className="p-3 text-center border border-[#ddd]"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
