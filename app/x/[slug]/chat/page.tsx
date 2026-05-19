import { redirect } from "next/navigation";

export default function OrgChat({ params }: { params: { slug: string } }) {
  redirect(`/book/chat?org=${encodeURIComponent(params.slug)}`);
}
