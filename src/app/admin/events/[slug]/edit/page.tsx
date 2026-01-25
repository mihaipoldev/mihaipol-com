import { redirect } from "next/navigation";

export default async function EditEventPage() {
  redirect("/admin/events");
}
