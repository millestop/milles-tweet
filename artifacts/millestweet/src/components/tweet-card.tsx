import React from "react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Heart, Repeat2, MessageCircle, Trash2 } from "lucide-react";
import { Post } from "@workspace/api-client-react/src/generated/api.schemas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLikePost, useRetweetPost, useDeletePost, getListPostsQueryKey, getGetPostQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface TweetCardProps {
  post: Post;
  isDetail?: boolean;
}

export function TweetCard({ post, isDetail = false }: TweetCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const likeMutation = useLikePost();
  const retweetMutation = useRetweetPost();
  const deleteMutation = useDeletePost();

  const isLiked = user && post.likes.includes(user.id);
  const isRetweeted = user && post.retweets.includes(user.id);
  const isOwner = user && user.id === post.userId;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    likeMutation.mutate(
      { id: post.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
        }
      }
    );
  };

  const handleRetweet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    retweetMutation.mutate(
      { id: post.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
        }
      }
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOwner) return;

    if (window.confirm("هل أنت متأكد من حذف هذه التغريدة؟")) {
      deleteMutation.mutate(
        { id: post.id },
        {
          onSuccess: () => {
            toast({ title: "تم الحذف بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            if (isDetail) {
              setLocation("/");
            }
          }
        }
      );
    }
  };

  const navigateToPost = () => {
    if (!isDetail) {
      setLocation(`/post/${post.id}`);
    }
  };

  const navigateToUser = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (post.author) {
      setLocation(`/profile/${post.author.username}`);
    }
  };

  return (
    <div 
      className={`border-b border-border p-4 hover:bg-muted/30 transition-colors ${!isDetail ? 'cursor-pointer' : ''}`}
      onClick={navigateToPost}
    >
      <div className="flex gap-4">
        <div onClick={navigateToUser} className="shrink-0 cursor-pointer z-10">
          <Avatar className="w-12 h-12 border border-border">
            <AvatarImage src={post.author?.avatar || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {post.author?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm z-10 truncate">
              <span 
                className="font-bold hover:underline cursor-pointer truncate"
                onClick={navigateToUser}
              >
                {post.author?.name}
              </span>
              <span className="text-muted-foreground truncate" dir="ltr">@{post.author?.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground shrink-0 hover:underline">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}
              </span>
            </div>
            
            {isOwner && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive z-10" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className={`mt-1 mb-3 text-foreground whitespace-pre-wrap break-words ${isDetail ? 'text-xl font-medium leading-relaxed' : 'text-base'}`}>
            {post.content}
          </div>
          
          {post.image && (
            <div className="mt-3 mb-4 rounded-xl overflow-hidden border border-border">
              <img src={post.image} alt="Tweet media" className="w-full h-auto object-cover max-h-96" />
            </div>
          )}
          
          <div className="flex items-center justify-between text-muted-foreground max-w-md -ml-2 z-10">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 group gap-2 h-9 px-2 z-10"
              onClick={(e) => { e.stopPropagation(); navigateToPost(); }}
            >
              <div className="p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm">{post.repliesCount || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`hover:text-green-500 hover:bg-green-500/10 group gap-2 h-9 px-2 z-10 ${isRetweeted ? 'text-green-500' : 'text-muted-foreground'}`}
              onClick={handleRetweet}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/20 transition-colors">
                <Repeat2 className={`w-5 h-5 ${isRetweeted ? 'stroke-current' : ''}`} />
              </div>
              <span className="text-sm">{post.retweets.length || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`hover:text-pink-500 hover:bg-pink-500/10 group gap-2 h-9 px-2 z-10 ${isLiked ? 'text-pink-500' : 'text-muted-foreground'}`}
              onClick={handleLike}
            >
              <div className="p-2 rounded-full group-hover:bg-pink-500/20 transition-colors">
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-sm">{post.likes.length || 0}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}