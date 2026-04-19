import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageCircle } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون أكثر من حرفين"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون أكثر من 3 حروف").regex(/^[a-zA-Z0-9_]+$/, "يجب أن يحتوي على حروف إنجليزية وأرقام فقط"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون أكثر من 6 حروف"),
});

export default function Register() {
  const register = useRegister();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof registerSchema>) {
    register.mutate({ data }, {
      onSuccess: () => {
        window.location.href = "/";
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "خطأ في التسجيل",
          description: err?.error || "حدث خطأ، الرجاء المحاولة مرة أخرى",
        });
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="flex justify-center mb-8">
          <MessageCircle className="w-12 h-12 text-primary fill-primary" />
        </div>
        <h1 className="text-3xl font-bold text-center mb-8">إنشاء حساب جديد</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستخدم</FormLabel>
                  <FormControl>
                    <Input placeholder="username" dir="ltr" className="text-left" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input type="password" dir="ltr" className="text-left" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={register.isPending}>
              {register.isPending ? "جاري التحميل..." : "تسجيل"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-primary hover:underline font-bold">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}