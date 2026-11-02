import React, { useState } from 'react';
import { User, LogIn, UserPlus, LogOut, X, Check, Shield } from 'lucide-react';
import { storage } from '../services/storage';
import { UserAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const users = storage.getAllUsers();
  const isGuest = currentUser.id === 'guest_user';

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = storage.register(email, name, password);
    if (!res.success) {
      setError(res.error || 'Failed to register');
    } else {
      setSuccessMsg('Account created successfully! Your data is now saved to your account.');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1200);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = storage.login(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    } else {
      setSuccessMsg('Welcome back!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1000);
    }
  };

  const handleLogout = () => {
    storage.logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#181A20] border border-[#272A34] rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#272A34]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentUser.avatarColor || '#007AFF' }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{isGuest ? 'WorkoutApp Account' : currentUser.name}</h2>
              <p className="text-xs text-gray-400">{isGuest ? 'Currently using Guest Mode' : currentUser.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Guest Warning / Incentive */}
        {isGuest && (
          <div className="my-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
            <Shield className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-blue-200 leading-relaxed">
              Create an account or sign in so your workouts, weights, and custom routines are permanently saved and never lost if you clear Safari data!
            </p>
          </div>
        )}

        {/* Success / Error alerts */}
        {error && (
          <div className="my-3 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="my-3 p-3 bg-green-500/15 border border-green-500/40 rounded-xl text-xs text-green-300 flex items-center gap-2">
            <Check size={16} />
            {successMsg}
          </div>
        )}

        {!isGuest && mode !== 'switch' ? (
          <div className="py-4 space-y-4">
            <div className="bg-[#121316] p-4 rounded-xl space-y-2 border border-[#272A34]">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Account Type</span>
                <span className="text-green-400 font-medium">Permanent Account</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Preferred Unit</span>
                <span className="text-white uppercase font-bold">{currentUser.weightUnit}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Theme</span>
                <span className="text-white capitalize">{currentUser.theme}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {users.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMode('switch')}
                  className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition"
                >
                  Switch User
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        ) : mode === 'switch' ? (
          <div className="py-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select User</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    localStorage.setItem('workout_current_user_id_v1', u.id);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition ${
                    u.id === currentUser.id ? 'bg-blue-600/20 border border-blue-500' : 'bg-[#121316] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: u.avatarColor }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  {u.id === currentUser.id && <Check size={18} className="text-blue-400" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMode('login')}
              className="w-full py-2 text-xs text-blue-400 hover:underline"
            >
              Sign in with another email
            </button>
          </div>
        ) : (
          <div>
            {/* Mode Tabs */}
            <div className="flex bg-[#121316] p-1 rounded-xl my-4 border border-[#272A34]">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  mode === 'login' ? 'bg-[#007AFF] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  mode === 'register' ? 'bg-[#007AFF] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#121316] border border-[#272A34] rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#121316] border border-[#272A34] rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#121316] border border-[#272A34] rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-[#007AFF] hover:bg-blue-600 active:scale-[0.98] font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                {mode === 'login' ? 'Sign In to Account' : 'Create Free Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
