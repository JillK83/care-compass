import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AppShell.css'

export function AppShell() {
  const { signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__wordmark">Care Console</div>
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
        <button className="app-shell__signout" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
