import { redirect } from "next/navigation";

export default async function EditLabelPage() {
  redirect("/admin/labels");
}
