import React from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Attempting login with email:', email, 'password:', password); // Debug input
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in user:', userCredential.user.email, 'UID:', userCredential.user.uid);
      navigate('/');
    } catch (err) {
      let errorMessage = 'Failed to log in.';
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Check your connection.';
          break;
        default:
          errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Login error:', err.code, err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F9] font-poppins p-6 justify-center items-center">
      <h1 className="text-3xl font-bold text-[#0F084B] mb-6">Mori Delogica Login</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleLogin} className="w-full max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-4 border border-[#ddd] rounded-lg font-poppins text-[#333]"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-4 border border-[#ddd] rounded-lg font-poppins text-[#333]"
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-[#0F084B] text-white rounded-lg hover:bg-[#1a167d] transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;