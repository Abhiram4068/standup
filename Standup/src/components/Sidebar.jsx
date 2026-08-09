import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-name">Standup</div>
        </div>

        <div className="nav-group">
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={onClose}>
            <LayoutGrid size={15} strokeWidth={2} /> Projects
          </NavLink>
        </div>

        {/* <div className="sidebar-bottom">
          <div className="avatar-sm">RS</div>
          <div className="user-meta">
            <div className="user-name">Ravi S.</div>
            <div className="user-role">Personal workspace</div>
          </div>
        </div> */}
      </div>
    </>
  );
};

export default Sidebar;
