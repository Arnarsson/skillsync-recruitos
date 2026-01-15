import SearchBar from "@/components/SearchBar";
import BuildInPublicSection from "@/components/BuildInPublicSection";
import PricingSection from "@/components/PricingSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            Find elite{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              (but overlooked!)
            </span>{" "}
            engineers on Github
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            The first hiring platform that analyzes your candidates&apos; expertise through their open source work.
            Find the engineers and scientists shaping your domain.
          </p>

          <SearchBar />

          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Real-time GitHub analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Capability-based search</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-16 px-4 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10M+</div>
              <div className="text-sm text-muted-foreground">Engineers indexed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">500K+</div>
              <div className="text-sm text-muted-foreground">Repos analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Accuracy rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">2hrs</div>
              <div className="text-sm text-muted-foreground">Avg. time to hire</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop relying on resumes and job titles. Find engineers by the code they write.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Search by capability",
                description: "Describe the skills you need in natural language. Our AI understands context.",
              },
              {
                step: "2",
                title: "Analyze real work",
                description: "We analyze GitHub contributions, code quality, and project impact.",
              },
              {
                step: "3",
                title: "Connect directly",
                description: "Get deep profiles with contact info and reach out to your next hire.",
              },
            ].map((item) => (
              <Card key={item.step} className="bg-card border-border">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Build in Public */}
      <BuildInPublicSection />

      {/* Pricing */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
            Ready to find your next great hire?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of companies already using SkillSync to build world-class teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://cal.com" target="_blank" rel="noopener noreferrer">
                Book a Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
