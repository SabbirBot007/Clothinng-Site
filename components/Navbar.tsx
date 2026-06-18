"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { ShoppingBag, HeartIcon, LayoutDashboard, Package, LogOut, User } from "lucide-react"
import CartCount from "@/components/CartCount"

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (pathname.startsWith("/admin")) return null

  return (
    <>
      <input type="checkbox" id="nav-toggle" style={{ display: "none" }} />

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "var(--nav-height)",
        background: "rgba(10,10,10,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          maxWidth: "1400px", margin: "0 auto",
          padding: "0 1.25rem", height: "100%",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{
            fontFamily: "var(--font-display)", fontSize: "20px",
            fontWeight: 300, letterSpacing: "0.2em",
            color: "var(--text-primary)", textDecoration: "none",
            textTransform: "uppercase", zIndex: 101, flexShrink: 0,
          }}>
            Maison<span style={{ color: "var(--gold)" }}>.</span>
          </Link>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>

            {/* Cart */}
            <Link href="/cart" style={{
              color: "var(--text-secondary)", display: "flex",
              alignItems: "center", padding: "10px",
              textDecoration: "none", position: "relative",
            }}>
              <ShoppingBag size={20} strokeWidth={1.5} />
              <CartCount />
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" style={{
              position: "relative", color: "var(--text-secondary)", display: "flex",
              alignItems: "center", padding: "10px",
              textDecoration: "none",
            }}>
              <HeartIcon size={20} strokeWidth={1.5} />
            </Link>

            {/* Desktop user menu */}
            <div className="nav-desktop-links">
              {session ? (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {(session.user as any)?.isAdmin && (
                    <Link href="/admin" style={{
                      fontSize: "10px", letterSpacing: "0.12em",
                      textTransform: "uppercase", color: "var(--gold)",
                      textDecoration: "none", fontWeight: 500, padding: "8px 10px",
                    }}>
                      Admin
                    </Link>
                  )}
                  <Link href="/orders" style={{
                    fontSize: "10px", letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "var(--text-secondary)",
                    textDecoration: "none", fontWeight: 500, padding: "8px 10px",
                    transition: "color 0.2s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--gold)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                  >
                    Orders
                  </Link>
                  <button onClick={() => signOut()} style={{
                    background: "none", border: "1px solid var(--border)",
                    color: "var(--text-secondary)", fontSize: "10px",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "8px 14px", cursor: "pointer",
                    fontFamily: "var(--font-body)", fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)" }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button onClick={() => signIn("google")} className="btn-ghost" style={{ padding: "8px 16px" }}>
                  Sign In
                </button>
              )}
            </div>

            {/* Hamburger */}
            <label htmlFor="nav-toggle" className="nav-hamburger" style={{
              display: "none", flexDirection: "column", gap: "5px",
              cursor: "pointer", padding: "10px", zIndex: 101,
            }}>
              <span className="ham-line" />
              <span className="ham-line" />
              <span className="ham-line" />
            </label>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className="mobile-menu-drawer">
        <div style={{ padding: "24px 20px 48px" }}>
          <label htmlFor="nav-toggle" style={{
            display: "flex", justifyContent: "flex-end",
            cursor: "pointer", padding: "4px 0 20px",
            color: "var(--text-muted)", fontSize: "13px",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Close ✕
          </label>

          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {session ? (
              <>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{session.user?.email}</p>

                {(session.user as any)?.isAdmin && (
                  <Link href="/admin" style={{
                    color: "var(--gold)", textDecoration: "none",
                    fontSize: "11px", letterSpacing: "0.12em",
                    textTransform: "uppercase", fontWeight: 500,
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <LayoutDashboard size={14} /> Admin Panel
                  </Link>
                )}

                <Link href="/orders" style={{
                  color: "var(--text-secondary)", textDecoration: "none",
                  fontSize: "11px", letterSpacing: "0.12em",
                  textTransform: "uppercase", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <Package size={14} /> My Orders
                </Link>

                <Link href="/wishlist" style={{
                  color: "var(--text-secondary)", textDecoration: "none",
                  fontSize: "11px", letterSpacing: "0.12em",
                  textTransform: "uppercase", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <User size={14} /> Wishlist
                </Link>

                <button onClick={() => signOut()} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: "11px",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  textAlign: "left", padding: 0,
                  fontFamily: "var(--font-body)", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => signIn("google")} className="btn-primary"
                style={{ justifyContent: "center", width: "100%" }}>
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      <label htmlFor="nav-toggle" className="mobile-overlay" />

      <style>{`
        .nav-desktop-links { display: flex; align-items: center; gap: 8px; }
        .nav-hamburger     { display: none !important; }
        .mobile-menu-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(300px, 85vw);
          background: var(--black-soft);
          border-left: 1px solid var(--border);
          z-index: 99;
          transform: translateX(100%);
          transition: transform 0.28s ease;
          overflow-y: auto;
          padding-top: var(--nav-height);
        }
        .mobile-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); z-index: 98; cursor: pointer;
        }
        .ham-line {
          display: block; width: 22px; height: 2px;
          background: var(--text-primary); border-radius: 1px; transition: all 0.2s;
        }
        #nav-toggle:checked ~ nav .nav-hamburger .ham-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        #nav-toggle:checked ~ nav .nav-hamburger .ham-line:nth-child(2) { opacity: 0; }
        #nav-toggle:checked ~ nav .nav-hamburger .ham-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        #nav-toggle:checked ~ .mobile-menu-drawer { transform: translateX(0) !important; }
        #nav-toggle:checked ~ .mobile-overlay { display: block !important; }
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-hamburger     { display: flex !important; }
        }
      `}</style>
    </>
  )
}
