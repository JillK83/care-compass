import { NavLink, Outlet } from 'react-router-dom'
import './AppShell.css'

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <nav>
          <NavLink
            to="/clients"
            className={({ isActive }) => `app-shell__nav-link${isActive ? ' active' : ''}`}
          >
            Clients
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) => `app-shell__nav-link${isActive ? ' active' : ''}`}
          >
            Map
          </NavLink>
        </nav>
      </aside>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
