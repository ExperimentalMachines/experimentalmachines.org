import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/a100-quantization/";
const title = "A 2B model in ten GGUF formats on one A100";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
