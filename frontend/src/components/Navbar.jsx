import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  FileText,
  LayoutDashboard,
  BarChart3,
  Eye,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import Badge from './Badge';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/assignments', label: 'Assignments', icon: FileText },
    { to: '/student/group', label: 'My Group', icon: Users }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/assignments', label: 'Assignments', icon: FileText },
    { to: '/admin/monitoring', label: 'Monitoring', icon: Eye },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const navLinks = role === 'admin' ? adminLinks : studentLinks;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <NavLink
              to={role === 'admin' ? '/admin' : '/student'}
              className="flex items-center space-x-2.5 font-bold text-xl text-slate-900 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                {role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="tracking-tight font-extrabold bg-gradient-to-r from-brand-700 to-indigo-600 bg-clip-text text-transparent">
                  Joineazy
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {role === 'admin' ? 'Portal' : 'Student'}
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/student' || item.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-2 opacity-80" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/80">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {user?.email}
                </span>
              </div>
              <Badge variant={role === 'admin' ? 'admin' : 'student'} size="sm">
                {role === 'admin' ? 'Professor' : 'Student'}
              </Badge>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          <div className="p-3 mb-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Badge variant={role === 'admin' ? 'admin' : 'student'} size="sm">
              {role === 'admin' ? 'Professor' : 'Student'}
            </Badge>
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/student' || item.to === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-lg text-base font-medium ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3 opacity-80" />
                {item.label}
              </NavLink>
            );
          })}

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3.5 py-2.5 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
