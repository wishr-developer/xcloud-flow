import { SiteShell } from "@/components/site/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "./form";
import { Mail, MessageCircle, Phone } from "lucide-react";

export const metadata = { title: "お問い合わせ" };

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="container max-w-4xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">お問い合わせ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          サービスのご質問・法人導入のご相談など、お気軽にどうぞ。通常2営業日以内にご返信します。
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-primary" />
                メール
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              下記フォームよりお問い合わせください。担当者からご返信します。
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-primary" />
                チャット
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              受講中の方はマイページの「サポート」からチャットでお問い合わせいただけます (本番化時)。
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" />
                電話 (法人のみ)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              法人導入のご相談は、まずフォームよりお問い合わせください。折り返しご連絡します。
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>お問い合わせフォーム</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
