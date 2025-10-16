import { getGroups, getGroupPermissions } from "@/lib/db";
import { AlertTriangle, Shield } from "lucide-react";
import { PermissionsForm } from "./_components/PermissionsForm";

export const metadata = {
  title: 'Permissions - Admin Panel',
};

export default async function AdminPermissionsPage() {
  let error: string | null = null;
  let groups: Awaited<ReturnType<typeof getGroups>> = [];
  const initialPermissions: Record<string, Record<string, boolean>> = {};

  try {
    groups = await getGroups();
    // Preload global permissions for each group
    for (const g of groups) {
      const perms = await getGroupPermissions(g.id);
      initialPermissions[g.id] = {};
      for (const p of perms) {
        if (p.scopeType === 'global') initialPermissions[g.id][p.permission] = p.allowed;
      }
    }
  } catch (e: any) {
    error = "Failed to load groups. " + e.message;
    console.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Permissions</h1>
      </div>
      <p className="text-muted-foreground">User Groups and Access Control</p>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading</h3>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <PermissionsForm initialGroups={groups} initialPermissions={initialPermissions} />
    </div>
  );
}


