
import React, { useState } from 'react';
import { UserIcon } from './icons';

interface UserSelectorProps {
  initialName: string;
  onUserChange: (name: string) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ initialName, onUserChange }) => {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUserChange(name.trim());
    }
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <label htmlFor="userName" className="flex items-center gap-2 font-semibold whitespace-nowrap">
          <UserIcon className="w-5 h-5 text-sky-400" />
          Track Profile:
        </label>
        <input
          id="userName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name"
          className="w-full sm:flex-grow bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
        />
        <button
          type="submit"
          className="w-full sm:w-auto bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors"
        >
          Generate
        </button>
      </form>
    </div>
  );
};
