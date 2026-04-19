import React, { useState } from "react";
import { useListPosts, useCreatePost, getListPostsQueryKey, useGetFeedStats } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { TweetCard } from "@/components/tweet-card";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useAuth();
  const { data: posts, isLoading } = useListPosts();
  const { data: stats } = useGetFeedStats();
  const createPost = useCreatePost();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createPost.mutate(
      { data: { content: content.trim(), image: image || undefined } },
      {
        onSuccess: () => {
          setContent("");
          setImage("");
          setShowImageInput(false);
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          toast({ title: "تم نشر التغريدة" });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: err?.error || "فشل نشر التغريدة",
          });
        },
      },
    );
  };

  return (
    <div>
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 z-10">
        <h1 className="text-xl font-bold">الرئيسية</h1>
      </div>

      {stats && (
        <div className="flex gap-4 px-4 py-3 border-b border-border text-sm text-muted-foreground">
          <span><span className="font-bold text-foreground">{stats.totalPosts}</span> تغريدة</span>
          <span><span className="font-bold text-foreground">{stats.totalUsers}</span> مستخدم</span>
          <span><span className="font-bold text-foreground">{stats.totalLikes}</span> إعجاب</span>
          <span><span className="font-bold text-foreground">{stats.totalRetweets}</span> إعادة تغريد</span>
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="border-b border-border p-4">
          <div className="flex gap-3">
            <Avatar className="w-11 h-11 shrink-0">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="ما الذي يدور في بالك؟"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border-0 text-xl resize-none focus-visible:ring-0 p-0 min-h-[80px] placeholder:text-muted-foreground/60 bg-transparent"
                maxLength={280}
              />
              {showImageInput && (
                <Input
                  placeholder="رابط الصورة (اختياري)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  dir="ltr"
                  className="text-left mt-2"
                />
              )}
              {image && (
                <div className="mt-2 rounded-xl overflow-hidden border border-border max-h-48">
                  <img src={image} alt="معاينة" className="w-full h-auto object-cover" onError={() => setImage("")} />
                </div>
              )}
              <div className="flex items-center justify-between mt-3 border-t border-border pt-3">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-primary"
                    onClick={() => setShowImageInput(!showImageInput)}
                  >
                    <Image className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${content.length > 250 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {280 - content.length}
                  </span>
                  <Button
                    type="submit"
                    className="rounded-full font-bold px-5"
                    disabled={!content.trim() || createPost.isPending}
                  >
                    {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "غرّد"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts && posts.length > 0 ? (
        posts.map((post) => <TweetCard key={post.id} post={post} />)
      ) : (
        <div className="p-12 text-center text-muted-foreground">
          <p className="text-lg">لا توجد تغريدات بعد</p>
          <p className="text-sm mt-2">كن أول من يغرّد!</p>
        </div>
      )}
    </div>
  );
}
