import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', role: '' });

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Users'));
      const userList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      setError('Email and password are required.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      await updateDoc(doc(db, 'Users', userCredential.user.uid), {
        email: newUser.email,
        role: newUser.role,
        uid: userCredential.user.uid
      });
      setNewUser({ email: '', password: '', role: 'user' });
      setError('');
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user: ' + err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser || !editForm.email || !editForm.role) {
      setError('Email and role are required for update.');
      return;
    }
    try {
      await updateDoc(doc(db, 'Users', editUser.id), {
        email: editForm.email,
        role: editForm.role
      });
      setEditUser(null);
      setEditForm({ email: '', role: '' });
      setError('');
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'Users', id));
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user.');
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setEditForm({ email: user.email, role: user.role });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#F9F9F9] font-poppins">
      <h1 className="text-3xl font-bold text-[#0F084B] mb-6">Manage Users</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Create User Form */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl text-[#0F084B] font-semibold mb-4">Add New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
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
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Password"
            className="w-full p-3 border border-[#ddd] rounded-lg"
            required
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="w-full p-3 border border-[#ddd] rounded-lg"
          >
            <option value="user">warehouse_staff</option>
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

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-[#ddd]">
          <thead>
            <tr className="bg-[#0F084B] text-white">
              <th className="p-3 text-left border border-[#ddd]">Email</th>
              <th className="p-3 text-left border border-[#ddd]">Role</th>
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
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full p-2 border border-[#ddd] rounded"
                      />
                    ) : (
                      user.email || 'N/A'
                    )}
                  </td>
                  <td className="p-3 border border-[#ddd]">
                    {editUser && editUser.id === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full p-2 border border-[#ddd] rounded"
                      >
                        <option value="user">warehouse_staff</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      user.role || 'N/A'
                    )}
                  </td>
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
                <td colSpan="3" className="p-3 text-center border border-[#ddd]">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;