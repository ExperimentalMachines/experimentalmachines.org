import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/latency/";
const title = "Five chips, two runtimes";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
