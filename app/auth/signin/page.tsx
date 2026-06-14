import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import SignInButton from "@/components/SignInButton"

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session) redirect("/")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
        <p className="text-gray-500 mb-8">Sign in to continue to the store</p>
        <SignInButton />
      </div>
    </div>
  )
}