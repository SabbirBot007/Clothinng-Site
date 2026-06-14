import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) redirect("/")

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--black)" }}>
      <AdminSidebar />

      {/* Main content — offset for desktop sidebar, top bar on mobile */}
      <main className="admin-main">
        {children}
      </main>

      <style>{`
        .admin-main {
          margin-left: 220px;
          flex: 1;
          padding: 40px;
          min-height: 100vh;
          max-width: 100%;
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0;
            padding: 72px 16px 32px;
          }
        }
      `}</style>
    </div>
  )
}
