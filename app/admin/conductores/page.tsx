"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Edit, Trash, UserCheck, UserX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
  phone?: string
}

export default function AdminConductores() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [userToUpdateStatus, setUserToUpdateStatus] = useState<User | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/users?role=driver")
        if (!response.ok) {
          throw new Error("Error al cargar conductores")
        }
        const data = await response.json()
        setUsers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
        console.error("Error fetching users:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleCreateUser = () => {
    router.push("/admin/nuevo-conductor")
  }

  const handleEditUser = (userId: number) => {
    router.push(`/admin/conductores/${userId}`)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleStatusClick = (user: User) => {
    setUserToUpdateStatus(user)
    setIsStatusDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el conductor")
      }

      setUsers(users.filter((user) => user.id !== userToDelete.id))
      toast({
        title: "Conductor eliminado",
        description: `El conductor ${userToDelete.username} ha sido eliminado correctamente.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const confirmStatusChange = async () => {
    if (!userToUpdateStatus) return

    const newStatus = userToUpdateStatus.status === "active" ? "inactive" : "active"

    try {
      const response = await fetch(`/api/users/${userToUpdateStatus.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Error al cambiar el estado del conductor a ${newStatus}`)
      }

      setUsers(users.map((user) => (user.id === userToUpdateStatus.id ? { ...user, status: newStatus } : user)))

      toast({
        title: "Estado actualizado",
        description: `El conductor ${userToUpdateStatus.username} ahora está ${newStatus === "active" ? "activo" : "inactivo"}.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsStatusDialogOpen(false)
      setUserToUpdateStatus(null)
    }
  }

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter((user) => {
    // Asegurarse de que searchTerm y user.username no sean undefined
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    const username = user.username ? user.username.toLowerCase() : ""
    const email = user.email ? user.email.toLowerCase() : ""
    const phone = user.phone ? user.phone.toLowerCase() : ""

    return username.includes(term) || email.includes(term) || phone.includes(term)
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-64">
              <p className="text-lg">Cargando conductores...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-red-500">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conductores</CardTitle>
          <Button onClick={handleCreateUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Conductor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron conductores</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusClick(user)}
                        title={user.status === "active" ? "Desactivar" : "Activar"}
                      >
                        {user.status === "active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.id)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)} title="Eliminar">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al conductor {userToDelete?.username}? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para cambiar estado */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio de estado</DialogTitle>
            <DialogDescription>
              {userToUpdateStatus?.status === "active"
                ? `¿Estás seguro de que deseas desactivar al conductor ${userToUpdateStatus?.username}?`
                : `¿Estás seguro de que deseas activar al conductor ${userToUpdateStatus?.username}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmStatusChange}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
