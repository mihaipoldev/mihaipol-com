import { redirect } from "next/navigation";

export default async function EditArtistPage() {
  redirect("/admin/artists");
}
