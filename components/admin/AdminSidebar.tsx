"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
  LogOut,
  Store,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { label: "Dashboard",  href: "/admin",            icon: LayoutDashboard },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Products",   href: "/admin/products",   icon: Package },
  { label: "Orders",     href: "/admin/orders",     icon: ShoppingBag },
  { label: "Customers",  href: "/admin/customers",  icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: "18px",
            fontWeight: 300, letterSpacing: "0.2em",
            color: "var(--text-primary)", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <Image
              src="/Logo.png"
              alt="Next Era"
              width={20} 
              height={20} 
              style={{ objectFit: "contain" }}
            />
            Next Era
          </div>
          <p style={{
            fontSize: "9px", letterSpacing: "0.15em",
            textTransform: "uppercase", color: "var(--gold)", marginTop: "2px",
          }}>
            Admin Panel
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="sidebar-close-btn"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", display: "none", padding: "4px",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 20px", textDecoration: "none",
                fontSize: "12px", letterSpacing: "0.08em", fontWeight: 500,
                fontFamily: "var(--font-body)", transition: "all 0.2s",
                color: active ? "var(--gold)" : "var(--text-secondary)",
                background: active ? "rgba(201,168,76,0.08)" : "transparent",
                borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent",
              }}
            >
              <Icon size={15} strokeWidth={1.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "10px 0", textDecoration: "none",
            fontSize: "11px", letterSpacing: "0.08em", fontWeight: 500,
            fontFamily: "var(--font-body)", color: "var(--text-muted)",
            transition: "color 0.2s",
          }}
          className="admin-bottom-link"
        >
          <Store size={13} strokeWidth={1.5} /> View Store
        </Link>
        <Link
          href="/api/auth/signout"
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "10px 0", textDecoration: "none",
            fontSize: "11px", letterSpacing: "0.08em", fontWeight: 500,
            fontFamily: "var(--font-body)", color: "var(--text-muted)",
            transition: "color 0.2s",
          }}
          className="admin-bottom-link"
        >
          <LogOut size={13} strokeWidth={1.5} /> Sign Out
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: "220px", minHeight: "100vh",
          background: "var(--black-soft)",
          borderRight: "1px solid var(--border)",
          position: "fixed", top: 0, left: 0, zIndex: 30,
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="admin-mobile-topbar"
        style={{
          display: "none", position: "fixed",
          top: 0, left: 0, right: 0, height: "56px",
          background: "var(--black-soft)",
          borderBottom: "1px solid var(--border)",
          zIndex: 30, alignItems: "center", padding: "0 16px",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-secondary)", display: "flex",
            alignItems: "center", padding: "4px",
          }}
        >
          <Menu size={22} />
        </button>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: "16px",
          fontWeight: 300, letterSpacing: "0.2em",
          color: "var(--text-primary)", textTransform: "uppercase",
        }}>
          Next Era
        </div>
        <Link href="/" style={{ color: "var(--text-secondary)", display: "flex" }}>
          <Store size={18} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Mobile slide-in drawer */}
      <div
        className="admin-mobile-drawer"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: "260px",
          background: "var(--black-soft)",
          borderRight: "1px solid var(--border)",
          zIndex: 50,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <SidebarContent />
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 45, backdropFilter: "blur(2px)",
          }}
        />
      )}

      <style>{`
        .admin-bottom-link:hover { color: var(--gold) !important; }
        .sidebar-close-btn:hover { color: var(--text-primary) !important; }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-topbar { display: flex !important; }
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}
