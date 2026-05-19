import { redirect } from "next/navigation";

export default function OrgBook({ params }: { params: { slug: string } }) {
  // For MVP we route to the global book page; org filtering happens by
  // organization_id when the user is signed in. The slug is kept for branding.
  redirect(`/book?org=${encodeURIComponent(params.slug)}`);
}
