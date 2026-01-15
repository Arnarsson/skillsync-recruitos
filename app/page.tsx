import SearchBar from "@/components/SearchBar";
import BuildInPublicSection from "@/components/BuildInPublicSection";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find elite{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              (but overlooked!)
            </span>{" "}
            engineers on GitHub
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            The first hiring platform that sources engineers by what they&apos;ve actually built.
            Discover engineers and scientists shaping your domain.
          </p>

          <SearchBar />

          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Real-time GitHub analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Capability-based search</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-16 px-4 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10M+</div>
              <div className="text-sm text-gray-500">Engineers indexed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">500K+</div>
              <div className="text-sm text-gray-500">Repos analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">98%</div>
              <div className="text-sm text-gray-500">Accuracy rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">2hrs</div>
              <div className="text-sm text-gray-500">Avg. time to hire</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Stop relying on resumes and job titles. Find engineers by the code they write.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Search by capability</h3>
              <p className="text-gray-400">
                Describe the skills you need in natural language. Our AI understands context.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Analyze real work</h3>
              <p className="text-gray-400">
                We analyze GitHub contributions, code quality, and project impact.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect directly</h3>
              <p className="text-gray-400">
                Get deep profiles with contact info and reach out to your next hire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Build in Public */}
      <BuildInPublicSection />

      {/* Pricing */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to find your next great hire?
          </h2>
          <p className="text-gray-400 mb-8">
            Join hundreds of companies already using SkillSync to build world-class teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="px-8 py-4 bg-white text-[#141517] rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Get Started Free
            </a>
            <a
              href="https://cal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-transparent border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-colors"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
