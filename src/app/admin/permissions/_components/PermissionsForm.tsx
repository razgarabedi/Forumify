"use client";

import { useEffect, useMemo, useState } from "react";
import type { Group } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { allPermissions, globalPermissions, moderationPermissions } from "@/lib/permissions";
import { createGroupAction, deleteGroupAction, getGroupPermissionsAction, setGroupPermissionAction } from "@/lib/actions/admin";
import { useActionState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  initialGroups: Group[];
  initialPermissions?: Record<string, Record<string, boolean>>; // groupId -> perm -> allowed
}

export function PermissionsForm({ initialGroups, initialPermissions }: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [newGroupName, setNewGroupName] = useState("");
  const [current, setCurrent] = useState<Record<string, Record<string, boolean>>>(initialPermissions || {}); // groupId -> perm -> allowed

  const [setPermState, setPermAction, setPermPending] = useActionState(setGroupPermissionAction, { success: false } as any);
  const [createGroupState, createGroupActionFn, createGroupPending] = useActionState(createGroupAction, { success: false } as any);
  const [loadState, setLoadAction] = useActionState(getGroupPermissionsAction as any, { success: false } as any);

  useEffect(() => {
    if (createGroupState?.success && (createGroupState as any).group) {
      setGroups((prev) => [...prev, (createGroupState as any).group]);
      setNewGroupName("");
    }
  }, [createGroupState]);

  useEffect(() => {
    if (!initialPermissions) {
      (async () => {
        const map: Record<string, Record<string, boolean>> = {};
        for (const g of groups) {
          try {
            const res = await getGroupPermissionsAction(g.id);
            if (res.success) {
              const per: Record<string, boolean> = {};
              for (const p of (res as any).permissions as any[]) {
                if (p.scopeType === 'global') per[p.permission] = !!p.allowed;
              }
              map[g.id] = per;
            }
          } catch {}
        }
        setCurrent(map);
      })();
    }
  }, [groups.length, initialPermissions]);

  useEffect(() => {
    if ((setPermState as any).success && (setPermState as any).groupId) {
      const { groupId, permission, allowed } = setPermState as any;
      setCurrent((prev) => ({
        ...prev,
        [groupId]: { ...(prev[groupId] || {}), [permission]: allowed },
      }));
    }
  }, [setPermState]);

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>User Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center gap-2 border rounded px-2 py-1">
                <span>{g.name}{g.isSystem ? ' (system)' : ''}</span>
                {!g.isSystem && (
                  <form action={async () => { await deleteGroupAction(g.id); }}>
                    <Button type="submit" variant="outline" size="sm">Delete</Button>
                  </form>
                )}
              </div>
            ))}
          </div>
          <form action={createGroupActionFn} className="flex gap-2">
            <Input name="name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="New group name" />
            <Button type="submit" disabled={createGroupPending || !newGroupName.trim()}>Add Group</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Permission Grid (Global)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="min-w-[640px]">
            <div className="grid" style={{ gridTemplateColumns: `1.5fr repeat(${groups.length}, 1fr)` }}>
              <div className="font-medium p-2 border-b">Permission</div>
              {groups.map((g) => (
                <div key={g.id} className="font-medium p-2 border-b text-center">{g.name}</div>
              ))}

              {[{ title: 'Global Permissions', keys: globalPermissions }, { title: 'Moderation Permissions', keys: moderationPermissions }].map((section) => (
                <div key={section.title} className="contents">
                  <div className="col-span-full bg-muted/40 p-2 font-semibold border-y">{section.title}</div>
                  {section.keys.map((perm) => (
                    <div key={`${section.title}-${perm}`} className="contents">
                      <div className="p-2 border-b">{perm.replace(/_/g, ' ')}</div>
                      {groups.map((g) => {
                        const selected = current[g.id]?.[perm];
                        return (
                          <div key={`${perm}-${g.id}`} className="p-2 border-b text-center">
                            <form action={setPermAction} className="inline-flex items-center justify-center gap-1">
                              <input type="hidden" name="groupId" value={g.id} />
                              <input type="hidden" name="permission" value={perm} />
                              <input type="hidden" name="scopeType" value="global" />
                              <input type="hidden" name="allowed" value="true" />
                              <Button type="submit" variant={selected === true ? 'default' : 'outline'} size="xs">Allow</Button>
                            </form>
                            <form action={setPermAction} className="inline-flex items-center justify-center gap-1 ml-1">
                              <input type="hidden" name="groupId" value={g.id} />
                              <input type="hidden" name="permission" value={perm} />
                              <input type="hidden" name="scopeType" value="global" />
                              <input type="hidden" name="allowed" value="false" />
                              <Button type="submit" variant={selected === false ? 'default' : 'outline'} size="xs">Deny</Button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


