"use client"

import type React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Menu, X, Home, Clock, FileText, Car, Users, LogOut, BarChart, Calculator, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { NotificationSystem } from "../../components/notification-system"

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

const Layout: React.FC<LayoutProps> = ({ children, title = "Taxi Cash Register" }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const isAdmin = session?.user?.role === "admin"
  const isNotDashboard = pathname !== "/admin" && pathname !== "/conductor"

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check on initial load
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleBackToDashboard = () => {
    if (isAdmin) {
      router.push("/admin")
    } else {
      router.push("/conductor")
    }
  }

  // Menú para administradores
  const adminMenuItems = [
    { label: "Dashboard", href: "/admin", icon: Home },
    { label: "Registros", href: "/admin/registros", icon: Car },
    { label: "Conductores", href: "/admin/conductores", icon: Users },
    { label: "Control Horario", href: "/admin/control-horario", icon: Clock },
    { label: "Nóminas", href: "/admin/nominas", icon: FileText },
    { label: "Contabilidad", href: "/admin/contabilidad", icon: Calculator },
    { label: "Informes", href: "/admin/informes", icon: BarChart },
  ]

  // Menú para conductores
  const driverMenuItems = [
    { label: "Dashboard", href: "/conductor", icon: Home },
    { label: "Mis Registros", href: "/conductor/registros", icon: Car },
    { label: "Control Horario", href: "/conductor/control-horario", icon: Clock },
    { label: "Mis Nóminas", href: "/conductor/nominas", icon: FileText },
  ]

  // Seleccionar el menú según el rol
  const menuItems = isAdmin ? adminMenuItems : driverMenuItems

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {isNotDashboard && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToDashboard}
                className="mr-2"
                aria-label="Volver al panel"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl md:text-2xl font-bold truncate">{title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sistema de notificaciones */}
            <NotificationSystem />

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white focus:outline-none"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:block">
              <ul className="flex space-x-4">
                {menuItems.slice(0, 4).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`hover:text-blue-400 ${pathname === item.href ? "text-blue-400" : ""}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button onClick={handleSignOut} className="hover:text-blue-400">
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 bg-gray-800 shadow-lg z-20 border-t border-gray-700">
            <nav className="container mx-auto py-4">
              <ul className="flex flex-col space-y-4">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 hover:bg-gray-700 rounded-md ${
                        pathname === item.href ? "bg-gray-700/50 text-blue-400" : ""
                      }`}
                      onClick={closeMenu}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => {
                      closeMenu()
                      handleSignOut()
                    }}
                    className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-700 rounded-md"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>
      <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
    </div>
  )
}

export default Layout
