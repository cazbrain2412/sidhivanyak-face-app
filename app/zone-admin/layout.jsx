"use client";

import Link from "next/link";
import { useState } from "react";

export default function ZoneAdminLayout({ children }) {
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

              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-5">
                <div className="flex-1">
                  <div className={`text-lg font-semibold ${collapsed ? "hidden" : ""}`}>
                    Siddhiynayak Enterprises — Zone Admin
                  </div>
                </div>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="p-2 rounded hover:bg-sky-600/60"
                >
                  ☰
                </button>
              </div>

              {/* 🔥 ZONE ADMIN MENU */}
              <nav className="px-2 mb-6">
                <NavItem
  href="/zone-admin/divisions"
  label="Divisions"
  collapsed={collapsed}
/>
 
                <NavItem href="/zone-admin/dashboard" label="Dashboard" collapsed={collapsed} />
                <NavItem href="/zone-admin/employees" label="Employees" collapsed={collapsed} />
                <NavItem href="/zone-admin/supervisors" label="Supervisors" collapsed={collapsed} />
                <NavItem href="/zone-admin/attendance" label="Attendance" collapsed={collapsed} />
                <NavItem href="/zone-admin/reports" label="Reports" collapsed={collapsed} />

                <div className="border-t border-sky-600/40 mt-4" />

                <NavItem href="/" label="Open Public App" collapsed={collapsed} />
              </nav>

              {/* Footer */}
              <div className="mt-auto px-4 py-4 text-sm text-sky-100/90">
                <div className={`${collapsed ? "text-center" : ""}`}>
                  <div className={collapsed ? "hidden" : "mb-1"}>Logged in as</div>
                  <div className="font-medium">Zone Admin</div>
                </div>
              </div>

            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-auto">
            <header className="flex items-center justify-between bg-white border-b px-6 py-3 shadow-sm">
              <h2 className="text-xl font-semibold">Zone Admin Panel</h2>
            </header>

            <section className="p-6">
              {children}
            </section>
          </main>
        </div>
      </body>
    </html>
  );
}

function NavItem({ href, label, collapsed }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sky-600/30 ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
        {label[0]}
      </div>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

