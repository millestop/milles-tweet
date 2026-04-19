import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetPost, useGetReplies, useCreatePost, getGetRepliesQueryKey, getListPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { TweetCard } from "@/components/tweet-card";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useGetPost(id || "", {
    query: { enabled: !!id }
  });
  const { data: replies, isLoading: loadingReplies } = useGetReplies(id || "", {
    query: { enabled: !!id }
  });

  const createPost = useCreatePost();
  const [replyContent, setReplyContent] = useState("");

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !id) return;

    createPost.mutate(
      { data: { content: replyContent.trim(), parentId: id } },
      {
        onSuccess: () => {
          setReplyContent("");
          queryClient.invalidateQueries({ queryKey: getGetRepliesQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          toast({ title: "تم نشر ردك" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "خطأ", description: err?.error || "فشل نشر الرد" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p>التغريدة غير موجودة</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 z-10 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">التغريدة</h1>
      </div>

      <TweetCard post={post} isDetail />

      {user && (
        <form onSubmit={handleReply} className="border-b border-border p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={`الرد على @${post.author?.username}`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="border-0 resize-none focus-visible:ring-0 p-0 bg-transparent placeholder:text-muted-foreground/60"
                maxLength={280}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  className="rounded-full font-bold"
                  disabled={!replyContent.trim() || createPost.isPending}
                  size="sm"
                >
                  {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "رد"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div>
        <div className="border-b border-border px-4 py-3">
          <span className="font-bold">الردود</span>
        </div>
        {loadingReplies ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : replies && replies.length > 0 ? (
          replies.map((reply) => <TweetCard key={reply.id} post={reply} />)
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">
            لا توجد ردود بعد
          </div>
        )}
      </div>
    </div>
  );
}
