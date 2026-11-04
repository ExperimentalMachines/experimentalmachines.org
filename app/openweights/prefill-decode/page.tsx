import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/prefill-decode/";
const title = "Prefill and decode on CPU, GPU and NPU";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
