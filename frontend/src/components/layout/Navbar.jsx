import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { Bell, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'HOSPITAL_ADMIN':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'DOCTOR':
      case 'DEPARTMENT_HEAD':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'PHARMACIST':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ACCOUNTANT':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'RECEPTIONIST':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Environment</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Info & Role Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => dispatch(logout())}
          title="Sign out of system"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
