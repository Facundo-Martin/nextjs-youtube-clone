type Props = {
  children: React.ReactNode;
};
export default function FeedLayout({ children }: Props) {
  return (
    <div>
      <div className="w-full bg-rose-500 p-4">I am navbar!</div>
      <div>{children}</div>
    </div>
  );
}
