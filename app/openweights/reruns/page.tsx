import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/reruns/";
const title = "What the reruns changed";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
