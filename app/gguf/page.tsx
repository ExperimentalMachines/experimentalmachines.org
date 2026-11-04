import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/";
const title = "Research";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
