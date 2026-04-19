import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageCircle } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export default function Login() {
  const login = useLogin();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof loginSchema>) {
    login.mutate({ data }, {
      onSuccess: () => {
        window.location.href = "/";
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: err?.error || "الرجاء التأكد من صحة البيانات",
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
        <h1 className="text-3xl font-bold text-center mb-8">تسجيل الدخول إلى ميلس تويت</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={login.isPending}>
              {login.isPending ? "جاري التحميل..." : "تسجيل الدخول"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="text-primary hover:underline font-bold">
            سجل الآن
          </Link>
        </div>
      </div>
    </div>
  );
}