import Moved, { movedMetadata } from "@/components/home/Moved";

const to = "/research/trainium-inferentia/";
const title = "Llama 3.1 8B on AWS Trainium and Inferentia";

export const metadata = movedMetadata(to, title);

export default function Forward() {
  return <Moved to={to} title={title} />;
}
