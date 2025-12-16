"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside
            className={`${
              collapsed ? "w-16" : "w-72"
            } bg-gradient-to-b from-sky-800 to-sky-700 text-white transition-all duration-200 shadow-lg`}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 px-4 py-5">
                <div className="flex-1">
                  <div className={`text-lg font-semibold ${collapsed ? "hidden" : ""}`}>
                    Siddhiynayak Enterprises — Admin
                  </div>
                </div>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="p-2 rounded hover:bg-sky-600/60"
                  title="Toggle sidebar"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <nav className="px-2 mb-6">
                <nav className="px-2 mb-6">
  <NavItem
    href="/zone-admin/dashboard"
    label="Dashboard"
    collapsed={collapsed}
  />

  {/* ❌ Zones / Divisions / Departments REMOVED for Zone Admin */}

  <NavItem
    href="/zone-admin/supervisors"
    label="Supervisors"
    collapsed={collapsed}
  />

  <NavItem
    href="/zone-admin/employees"
    label="Employees"
    collapsed={collapsed}
  />

  <NavItem
    href="/zone-admin/attendance"
    label="Attendance"
    collapsed={collapsed}
  />

  <NavItem
    href="/zone-admin/reports"
    label="Reports"
    collapsed={collapsed}
  />

  <div className="border-t border-sky-600/40 mt-4" />

  <NavItem
    href="/"
    label="Open Public App"
    collapsed={collapsed}
  />
</nav>

                
                
                
                
                
                
                
                

              <div className="mt-auto px-4 py-4 text-sm text-sky-100/90">
                <div className={`${collapsed ? "text-center" : ""}`}>
                  <div className={collapsed ? "hidden" : "mb-1"}>Logged in as</div>
                  <div className="font-medium">Super Admin</div>
                  <div className="text-xs opacity-80">sidhivnayak@company.com</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {/* Top header */}
            <header className="flex items-center justify-between bg-white border-b px-6 py-3 shadow-sm">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800">Admin Panel</h2>
                <div className="hidden sm:flex items-center gap-3 text-sm text-slate-600">
                  <div className="px-3 py-1 rounded bg-slate-100">Overview</div>
                  <div className="px-3 py-1 rounded hover:bg-slate-100 cursor-pointer">Settings</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-slate-600 text-sm">Today</div>
                  <div className="text-slate-800 font-medium">{new Date().toLocaleDateString()}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="px-3 py-2 rounded bg-sky-600 text-white text-sm">Create</button>
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 20v-1c0-2.76 4.48-4 6-4s6 1.24 6 4v1H6z" stroke="currentColor" strokeWidth="0.6"/>
                    </svg>
                  </div>
                </div>
              </div>
            </header>

            {/* Content area */}
            <section className="p-6">
              <div className="max-w-screen-4xl mx-auto">
                {children}
              </div>
            </section>
          </main>
        </div>
      </body>
    </html>
  );
}

function NavItem({ href, label, collapsed }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sky-600/30 transition-colors ${collapsed ? "justify-center" : ""}`}>
      <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-sm font-semibold">
        {label.slice(0,1)}
      </div>
      <span className={`${collapsed ? "hidden" : "truncate"}`}>{label}</span>
    </Link>
  );
}

