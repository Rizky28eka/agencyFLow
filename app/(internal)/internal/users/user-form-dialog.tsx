'use client'

import * as React from "react"
import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createUser, updateUser, User, Role, UserWithRole } from "./actions" // Import actions and types

interface UserFormDialogProps {
  user?: User // Optional, for editing
  roles: Role[]
  trigger?: React.ReactElement // Optional, for custom trigger
  onUserCreated?: (newUser: UserWithRole) => void // Callback for new user creation
  onUserUpdated?: (updatedUser: UserWithRole) => void // Callback for user update
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}

export function UserFormDialog({
  user,
  roles,
  trigger,
  onUserCreated,
  onUserUpdated,
}: UserFormDialogProps) {
  const [open, setOpen] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  const initialState = {
    success: false,
    message: "",
  }

  const [createState, createAction] = useActionState(createUser, initialState)
  const [updateState, updateAction] = useActionState(updateUser, initialState)

  useEffect(() => {
    if (createState.message) {
      if (createState.success) {
        toast.success(createState.message)
        setOpen(false)
        formRef.current?.reset()
        // Assuming createUser action returns the new user object
        // This part needs adjustment if the action doesn't return the user
        // For now, we'll just re-validatePath or rely on revalidatePath
        // if (onUserCreated && createState.newUser) {
        //   onUserCreated(createState.newUser);
        // }
      } else {
        toast.error(createState.message)
      }
    }
  }, [createState, onUserCreated])

  useEffect(() => {
    if (updateState.message) {
      if (updateState.success) {
        toast.success(updateState.message)
        setOpen(false)
        // Assuming updateUser action returns the updated user object
        // if (onUserUpdated && updateState.updatedUser) {
        //   onUserUpdated(updateState.updatedUser);
        // }
      } else {
        toast.error(updateState.message)
      }
    }
  }, [updateState, onUserUpdated])

  const action = user ? updateAction : createAction

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline">
            <IconPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update the user's profile and role."
              : "Create a new user account for your organization."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} ref={formRef}>
          {user && <input type="hidden" name="id" value={user.id} />}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user?.name || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {user ? "(Leave blank to keep current)" : ""}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={!user} // Required only for new users
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleId">Role</Label>
              <Select name="roleId" defaultValue={user?.roleId || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
