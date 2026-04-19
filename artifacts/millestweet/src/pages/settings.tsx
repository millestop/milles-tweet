import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(50, "الاسم طويل جداً"),
  bio: z.string().max(160, "السيرة الذاتية يجب ألا تتجاوز 160 حرفاً").optional(),
  avatar: z.string().url("رابط الصورة غير صالح").or(z.literal("")).optional(),
});

export default function Settings() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      avatar: user?.avatar || "",
    },
  });

  const watchAvatar = form.watch("avatar");

  function onSubmit(data: z.infer<typeof settingsSchema>) {
    updateProfile.mutate(
      { data: { name: data.name, bio: data.bio || "", avatar: data.avatar || "" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          refetch();
          toast({ title: "تم تحديث الملف الشخصي بنجاح" });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: err?.error || "فشل التحديث",
          });
        },
      }
    );
  }

  if (!user) return null;

  return (
    <div>
      <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 z-10">
        <h1 className="text-xl font-bold">تعديل الملف الشخصي</h1>
      </div>

      <div className="p-4">
        <div className="flex justify-center mb-6">
          <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-border">
            <AvatarImage src={watchAvatar || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl>
                    <Input placeholder="اسمك" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نبذة عنك</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أخبر الآخرين قليلاً عن نفسك..."
                      className="resize-none"
                      rows={4}
                      maxLength={160}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-left text-xs text-muted-foreground">{(field.value || "").length}/160</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الصورة الشخصية</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.jpg" dir="ltr" className="text-left" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2 pb-1 text-sm text-muted-foreground border-t border-border">
              <div className="flex items-center gap-2">
                <span>اسم المستخدم:</span>
                <span dir="ltr" className="font-mono text-foreground">@{user.username}</span>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
