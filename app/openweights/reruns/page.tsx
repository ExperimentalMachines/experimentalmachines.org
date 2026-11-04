import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/reruns/";
const title = "A 640-token reply cap was cutting off the LFM2.5 2.6B";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
