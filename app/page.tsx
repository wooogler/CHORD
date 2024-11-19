import { redirect } from "next/navigation";

export default function Home() {
  redirect("/prompt?title=Blacksburg%2C+Virginia&menu=true");
}
