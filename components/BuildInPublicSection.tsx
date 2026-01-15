import { Github, Twitter, MessageSquare } from "lucide-react";

export default function BuildInPublicSection() {
  return (
    <section id="buildinpublic" className="py-24 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-blue-400 font-mono text-sm">#buildinpublic</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
            Built in the open, for the community
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We believe in transparency. Every feature, every decision, every line of code
            is built with the developer community in mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#1a1b1e] rounded-xl border border-white/5">
            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-4">
              <Github className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="font-semibold mb-2">Open Source First</h3>
            <p className="text-sm text-gray-400">
              Our core algorithms are open source. We trust the community to help us build better.
            </p>
          </div>

          <div className="p-6 bg-[#1a1b1e] rounded-xl border border-white/5">
            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-4">
              <Twitter className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="font-semibold mb-2">Public Roadmap</h3>
            <p className="text-sm text-gray-400">
              Follow our journey on Twitter. We share wins, losses, and everything in between.
            </p>
          </div>

          <div className="p-6 bg-[#1a1b1e] rounded-xl border border-white/5">
            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="font-semibold mb-2">Community Driven</h3>
            <p className="text-sm text-gray-400">
              Feature requests, bug reports, and feedback directly shape what we build next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
