import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/window/";
const title = "Does the exported window matter?";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
