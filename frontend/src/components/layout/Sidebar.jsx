import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Activity,
  Users,
  UserCheck,
  Calendar,
  FileText,
  Pill,
  BedDouble,
  CreditCard,
  TrendingUp,
  Building2,
  BarChart3,
  Shield,
  Layers,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;

  // Navigation Items defined with role authorization lists
  const navigationItems = [
    {
      label: 'Main Dashboard',
      path: '/dashboard',
      icon: Activity,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST', 'RECEPTIONIST', 'ACCOUNTANT', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Patient Management',
      path: '/patients',
      icon: Users,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Doctor Directory',
      path: '/doctors',
      icon: UserCheck,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Departments',
      path: '/departments',
      icon: Layers,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Medical Records (EMR)',
      path: '/medical-records',
      icon: FileText,
      roles: ['SUPER_ADMIN', 'DOCTOR', 'PATIENT', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Pharmacy & Inventory',
      path: '/pharmacy',
      icon: Pill,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'DOCTOR'],
    },
    {
      label: 'Admissions & Beds',
      path: '/admissions',
      icon: BedDouble,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Billing & Finance',
      path: '/finance',
      icon: CreditCard,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'],
    },
    {
      label: 'Recovery & Outcomes',
      path: '/recovery-analytics',
      icon: TrendingUp,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Hospital Facilities',
      path: '/facilities',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'Reports & Exports',
      path: '/reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'DEPARTMENT_HEAD'],
    },
    {
      label: 'User & Access Control',
      path: '/users',
      icon: Shield,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'],
    },
  ];

  const visibleItems = navigationItems.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight leading-none">SmartHealth</h1>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">HMS Enterprise</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 text-xs text-slate-400 flex items-center justify-between">
          <span>v1.0 Production</span>
          <span className="text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
          </span>
        </div>
      </aside>
    </>
  );
};
