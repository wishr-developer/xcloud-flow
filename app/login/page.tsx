import Link from "next/link";
import { LoginForm } from "./form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>BookSpace 管理画面にアクセスします</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            アカウントをお持ちでない方は{" "}
            <Link className="text-primary hover:underline" href="/signup">
              新規登録
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">
              ← トップへ戻る
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
