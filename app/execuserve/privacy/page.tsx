import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { site } from "@/lib/content";

// The published copy of the policy in the ExecuServe repository (docs/privacy-policy.md).
// This page is the URL given to Google Play; change both together, and the date with them.

export const metadata: Metadata = {
  title: "ExecuServe privacy policy",
  description: "What ExecuServe keeps on your phone, what leaves it and when. No account, no analytics, no server of ours.",
};

const effective = "2 October 2026";

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="wide text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-7 text-ink-soft">{children}</div>
    </section>
  );
}

const Item = ({ lead, children }: { lead: string; children: React.ReactNode }) => (
  <li>
    <span className="font-semibold text-ink">{lead}</span> {children}
  </li>
);

const permissions: [string, string][] = [
  ["Internet, network and Wi-Fi state", "Serving requests, downloading models, finding the phone's addresses"],
  ["Wi-Fi multicast", "Announcing the server on your network, in network mode only"],
  ["Foreground service, wake lock", "Keeping the server answering while the screen is off"],
  ["Notifications", "The ongoing notification that shows the server is running"],
  ["Start at boot", "Restarting the server after a reboot, if you turned that on"],
  ["Battery optimisation exemption", "Asked from Settings, so Android does not stop the server in the background"],
  ["Hide overlays", "Stops other apps covering the confirmation when another app asks to start the server"],
];

export default function Privacy() {
  return (
    <>
      <Nav />
      <main>
        <article className="mx-auto max-w-3xl px-6 pb-20 pt-14 sm:pt-20">
          <p className="text-sm text-ink-soft">
            <a href="/execuserve/" className="text-blue hover:text-blue-deep">
              ExecuServe
            </a>{" "}
            · Effective {effective}
          </p>
          <h1 className="wide mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Privacy policy</h1>
          <p className="mt-6 text-lg leading-7 text-ink-soft">
            ExecuServe runs language models on your phone and serves them to apps you allow. It has no account, no analytics, no advertising, no crash
            reporter and no server of ours. Nothing you send to a model, and nothing a model replies, is sent to us.
          </p>

          <Part title="What stays on your phone">
            <ul className="list-disc space-y-3 pl-5">
              <Item lead="Models">you download or copy onto the phone, in the app&apos;s own storage.</Item>
              <Item lead="Settings and API keys.">
                Keys let apps use the server; they are stored in the app&apos;s private storage and are excluded from Android backups and from
                device-to-device transfer.
              </Item>
              <Item lead="Run history:">
                for each request, which model answered, which key asked (by the name you gave it), timings, token counts, and the phone&apos;s battery and
                temperature state at the time. Never the prompt, the reply, or the key itself. Kept for the last 10,000 requests or 30 days, whichever comes
                first, and deleted with the app.
              </Item>
              <Item lead="Requests and replies">
                pass through the phone&apos;s memory while they are answered. For the Responses API&apos;s <code>previous_response_id</code>, up to 64 recent
                responses are held in memory for at most an hour, per key; they are not written to storage and are gone when the server stops.
              </Item>
              <Item lead="The browser chat">
                keeps your key and conversations only in that browser tab&apos;s memory; they are gone when you reload or close it.
              </Item>
            </ul>
          </Part>

          <Part title="What leaves your phone, and when">
            <ul className="list-disc space-y-3 pl-5">
              <Item lead="Hugging Face.">
                When you browse the catalog, download a model, or the app shows a model publisher&apos;s picture, the app contacts{" "}
                <code>huggingface.co</code> and its download servers. Like any website they receive your IP address and the app&apos;s name as the user
                agent. No account or token is sent. Hugging Face&apos;s own privacy policy applies to those requests.
              </Item>
              <Item lead="The apps and devices you let in.">
                The server answers whoever presents a valid key: on this phone only, by default, or on your local network if you choose Your network. In
                network mode the connection is plain HTTP, so others on the same network could read requests, replies and keys in transit; use a network
                you trust, or a private tunnel.
              </Item>
              <Item lead="Network discovery.">
                In network mode only, the phone announces the server on the local network (as <code>_execuserve._tcp</code>, with your phone&apos;s model
                name) so clients can find it.
              </Item>
              <Item lead="Things you choose to share.">
                Exporting your run history, or reporting a model reply, opens Android&apos;s share sheet. Nothing is sent until you pick where it goes, and
                it goes only there.
              </Item>
            </ul>
            <p>We do not sell, rent or share data, because we do not collect it.</p>
          </Part>

          <Part title="Model replies">
            <p>
              Replies come from third-party models you choose, not from us. They can be wrong or offensive. Any reply in the app can be reported from its
              Report this reply action, which shows you the full report before you share it.
            </p>
          </Part>

          <Part title="Permissions">
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Permissions, scrolls sideways on small screens">
              <table className="w-full min-w-[32rem] border-collapse text-sm">
                <thead className="text-left">
                  <tr className="border-b border-rule">
                    <th className="py-2 pr-4 font-normal">Permission</th>
                    <th className="py-2 font-normal">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map(([name, why]) => (
                    <tr key={name} className="border-b border-rule align-top">
                      <td className="py-2.5 pr-4 text-ink">{name}</td>
                      <td className="py-2.5">{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Part>

          <Part title="Children">
            <p>ExecuServe is a developer tool and is not directed at children under 13.</p>
          </Part>

          <Part title="Changes and contact">
            <p>
              Changes to this policy are published on this page, with the effective date above. Questions:{" "}
              <a href={`mailto:${site.email}`} className="text-blue hover:text-blue-deep">
                {site.email}
              </a>
              .
            </p>
          </Part>
        </article>
      </main>
      <Footer />
    </>
  );
}
