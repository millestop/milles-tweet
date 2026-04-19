import React, { useState } from "react";
import {
  useAdminListUsers,
  useAdminListPosts,
  useAdminGetLogs,
  useBanUser,
  usePromoteUser,
  useAdminDeleteUser,
  useDeletePost,
  getAdminListUsersQueryKey,
  getAdminListPostsQueryKey,
  getAdminGetLogsQueryKey,
  getListPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Loader2, Trash2, Ban, Star, StarOff, ShieldOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Admin() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allUsers, isLoading: loadingUsers } = useAdminListUsers();
  const { data: allPosts, isLoading: loadingPosts } = useAdminListPosts();
  const { data: logs, isLoading: loadingLogs } = useAdminGetLogs();

  const banUser = useBanUser();
  const promoteUser = usePromoteUser();
  const deleteUser = useAdminDeleteUser();
  const deletePost = useDeletePost();

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
  const refreshPosts = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListPostsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
  };
  const refreshLogs = () => queryClient.invalidateQueries({ queryKey: getAdminGetLogsQueryKey() });

  const handleBan = (userId: string, banned: boolean) => {
    banUser.mutate(
      { userId, data: { banned } },
      {
        onSuccess: () => {
          toast({ title: banned ? "تم حظر المستخدم" : "تم رفع الحظر" });
          refreshUsers();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "خطأ", description: err?.error }),
      }
    );
  };

  const handlePromote = (userId: string, admin: boolean) => {
    promoteUser.mutate(
      { userId, data: { admin } },
      {
        onSuccess: () => {
          toast({ title: admin ? "تم الترقية إلى مدير" : "تم إزالة صلاحيات المدير" });
          refreshUsers();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "خطأ", description: err?.error }),
      }
    );
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف مستخدم @${username}؟`)) return;
    deleteUser.mutate(
      { userId },
      {
        onSuccess: () => {
          toast({ title: "تم حذف المستخدم" });
          refreshUsers();
          refreshPosts();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "خطأ", description: err?.error }),
      }
    );
  };

  const handleDeletePost = (postId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه التغريدة؟")) return;
    deletePost.mutate(
      { id: postId },
      {
        onSuccess: () => {
          toast({ title: "تم حذف التغريدة" });
          refreshPosts();
          refreshLogs();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "خطأ", description: err?.error }),
      }
    );
  };

  const eventLabels: Record<string, string> = {
    new_post: "تغريدة جديدة",
    delete_post: "حذف تغريدة",
    like: "إعجاب",
    unlike: "إلغاء إعجاب",
    retweet: "إعادة تغريد",
    unretweet: "إلغاء إعادة تغريد",
    ban_user: "حظر مستخدم",
    unban_user: "رفع حظر",
    promote_admin: "ترقية مدير",
    demote_admin: "إزالة مدير",
    delete_user: "حذف مستخدم",
    profile_update: "تحديث ملف",
    register: "تسجيل جديد",
  };

  return (
    <div>
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">لوحة الإدارة</h1>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-12 p-0">
          <TabsTrigger value="users" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-12">
            المستخدمون ({allUsers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-12">
            التغريدات ({allPosts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-12">
            السجلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="m-0">
          {loadingUsers ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            allUsers?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-4 border-b border-border">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={u.avatar || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {u.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-sm">{u.name}</span>
                    {u.role === "admin" && (
                      <Badge variant="secondary" className="text-xs text-primary border-primary/30 gap-1">
                        <Shield className="w-3 h-3" />مدير
                      </Badge>
                    )}
                    {u.banned && <Badge variant="destructive" className="text-xs">محظور</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground" dir="ltr">@{u.username}</p>
                </div>
                {u.id !== currentUser?.id && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      title={u.banned ? "رفع الحظر" : "حظر"}
                      onClick={() => handleBan(u.id, !u.banned)}
                    >
                      {u.banned ? <ShieldOff className="w-4 h-4 text-green-500" /> : <Ban className="w-4 h-4 text-yellow-500" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      title={u.role === "admin" ? "إزالة مدير" : "ترقية مدير"}
                      onClick={() => handlePromote(u.id, u.role !== "admin")}
                    >
                      {u.role === "admin" ? <StarOff className="w-4 h-4 text-primary" /> : <Star className="w-4 h-4 text-primary" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="حذف المستخدم"
                      onClick={() => handleDeleteUser(u.id, u.username)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="posts" className="m-0">
          {loadingPosts ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            allPosts?.map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-4 border-b border-border">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={post.author?.avatar || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {post.author?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-sm mb-1">
                    <span className="font-bold">{post.author?.name}</span>
                    <span className="text-muted-foreground" dir="ltr">@{post.author?.username}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{post.likes.length} إعجاب</span>
                    <span>{post.retweets.length} إعادة تغريد</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDeletePost(post.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="logs" className="m-0">
          {loadingLogs ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : logs && logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border-b border-border text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {eventLabels[log.event] || log.event}
                    </Badge>
                    {log.username && (
                      <span className="text-muted-foreground" dir="ltr">@{log.username}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ar })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-muted-foreground">لا توجد سجلات</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
