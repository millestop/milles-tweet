import React, { useState } from "react";
import { useListUsers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search as SearchIcon, Loader2 } from "lucide-react";

export default function Search() {
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useListUsers(
    { search: search || undefined },
    { query: { enabled: true } }
  );

  return (
    <div>
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 z-10">
        <h1 className="text-xl font-bold mb-3">البحث</h1>
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مستخدمين..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : users && users.length > 0 ? (
          users.map((user) => (
            <Link key={user.id} href={`/profile/${user.username}`}>
              <div className="flex items-center gap-3 p-4 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{user.name}</span>
                    {user.role === "admin" && (
                      <Badge variant="secondary" className="gap-1 text-primary border-primary/30 text-xs shrink-0">
                        <Shield className="w-3 h-3" />
                        مدير
                      </Badge>
                    )}
                    {user.banned && (
                      <Badge variant="destructive" className="text-xs shrink-0">محظور</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm" dir="ltr">@{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground truncate mt-1">{user.bio}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            {search ? (
              <p>لا توجد نتائج لـ "{search}"</p>
            ) : (
              <p>ابدأ الكتابة للبحث عن مستخدمين</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
