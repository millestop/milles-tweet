import React from "react";
import { useParams } from "wouter";
import { useGetUserByUsername, useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { TweetCard } from "@/components/tweet-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Shield } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user: currentUser } = useAuth();

  const { data: profileUser, isLoading: loadingUser } = useGetUserByUsername(username || "", {
    query: { enabled: !!username }
  });

  const { data: posts, isLoading: loadingPosts } = useListPosts(
    { userId: profileUser?.id },
    { query: { enabled: !!profileUser?.id } }
  );

  if (loadingUser) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p className="text-lg">المستخدم غير موجود</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 z-10">
        <h1 className="text-xl font-bold">{profileUser.name}</h1>
        <p className="text-sm text-muted-foreground">{posts?.length || 0} تغريدة</p>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <Avatar className="w-20 h-20 border-4 border-background ring-2 ring-border">
            <AvatarImage src={profileUser.avatar || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
              {profileUser.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {profileUser.role === "admin" && (
            <Badge variant="secondary" className="gap-1 text-primary border-primary/30">
              <Shield className="w-3 h-3" />
              مدير
            </Badge>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{profileUser.name}</h2>
          </div>
          <p className="text-muted-foreground" dir="ltr">@{profileUser.username}</p>

          {profileUser.bio && (
            <p className="mt-3 text-base">{profileUser.bio}</p>
          )}

          {profileUser.banned && (
            <div className="mt-3 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm">
              هذا الحساب محظور
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 text-muted-foreground text-sm">
            <CalendarDays className="w-4 h-4" />
            <span>
              انضم في {format(new Date(profileUser.createdAt), "MMMM yyyy", { locale: ar })}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="border-b border-border px-4 py-3">
          <span className="font-bold border-b-2 border-primary pb-3">التغريدات</span>
        </div>

        {loadingPosts ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => <TweetCard key={post.id} post={post} />)
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <p>لا توجد تغريدات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
