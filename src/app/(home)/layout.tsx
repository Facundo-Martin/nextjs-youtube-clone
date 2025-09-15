import { HomeLayout } from "@/modules/home/ui/layout/home-layout";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <HomeLayout>{children}</HomeLayout>;
}
