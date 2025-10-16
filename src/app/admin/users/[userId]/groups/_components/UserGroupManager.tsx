"use client";

import { useState, useEffect } from "react";
import type { User, Group } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { assignUserToGroupAction, removeUserFromGroupAction } from "@/lib/actions/admin";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Shield } from "lucide-react";

interface Props {
  user: User;
  allGroups: Group[];
  userGroups: Group[];
}

export function UserGroupManager({ user, allGroups, userGroups }: Props) {
  const { toast } = useToast();
  const [currentUserGroups, setCurrentUserGroups] = useState<Group[]>(userGroups);
  const [isLoading, setIsLoading] = useState(false);

  // Get non-system groups for assignment
  const assignableGroups = allGroups.filter(group => !group.isSystem);

  const handleGroupToggle = async (groupId: string, isAssigned: boolean) => {
    setIsLoading(true);
    try {
      if (isAssigned) {
        // Remove user from group
        const result = await removeUserFromGroupAction(user.id, groupId);
        if (result.success) {
          setCurrentUserGroups(prev => prev.filter(g => g.id !== groupId));
          toast({
            title: "Success",
            description: "User removed from group successfully.",
          });
        } else {
          throw new Error(result.message || 'Failed to remove user from group');
        }
      } else {
        // Add user to group
        const result = await assignUserToGroupAction(user.id, groupId);
        if (result.success) {
          const groupToAdd = allGroups.find(g => g.id === groupId);
          if (groupToAdd) {
            setCurrentUserGroups(prev => [...prev, groupToAdd]);
          }
          toast({
            title: "Success",
            description: "User assigned to group successfully.",
          });
        } else {
          throw new Error(result.message || 'Failed to assign user to group');
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not update user group assignment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isUserInGroup = (groupId: string) => {
    return currentUserGroups.some(g => g.id === groupId);
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-semibold">{user.username}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.isAdmin && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Current Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserGroups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentUserGroups.map((group) => (
                <Badge 
                  key={group.id} 
                  variant={group.isSystem ? "secondary" : "default"}
                  className="flex items-center gap-1"
                >
                  {group.name}
                  {group.isSystem && <span className="text-xs">(system)</span>}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">User is not assigned to any custom groups.</p>
          )}
        </CardContent>
      </Card>

      {/* Assignable Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Available Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {assignableGroups.length > 0 ? (
            <div className="space-y-3">
              {assignableGroups.map((group) => {
                const isAssigned = isUserInGroup(group.id);
                return (
                  <div key={group.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={group.id}
                      checked={isAssigned}
                      onCheckedChange={() => handleGroupToggle(group.id, isAssigned)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={group.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{group.name}</span>
                        <Badge variant="outline">
                          Custom Group
                        </Badge>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No custom groups available for assignment.</p>
          )}
        </CardContent>
      </Card>

      {/* System Groups Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              System groups are automatically assigned based on user status:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Members (all logged-in users)</Badge>
              <Badge variant="secondary">Guests (non-logged-in users)</Badge>
              {user.isAdmin && (
                <Badge variant="destructive">Admins (admin users)</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
