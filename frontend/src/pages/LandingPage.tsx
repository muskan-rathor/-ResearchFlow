
import { Link } from "react-router-dom";
import {
  BookOpen,
  Sparkles,
  GitCompareArrows,
  Network,
  ArrowRight,
  BrainCircuit,
  Library,
  ChartNoAxesCombined,
} from "lucide-react";

const features = [
  {
    icon: Library,
    title: "Research Paper Library",
    description:
      "Upload, organize and manage your research papers in one workspace.",
  },
  {
    icon: Sparkles,
    title: "AI Research Assistant",
    description:
      "Ask questions about your uploaded papers and get context-based answers.",
  },
  {
    icon: GitCompareArrows,
    title: "Paper Comparison",
    description:
      "Compare methodologies, datasets, findings and limitations across papers.",
  },
  {
    icon: Network,
    title: "Research Gap Discovery",
    description:
      "Identify recurring limitations and explore potential research directions.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-xl font-bold text-white">
              R
            </div>
            <span className="text-xl font-bold">ResearchFlow</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-violet-50 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700">
              <Sparkles size={16} />
              AI-Powered Research Workspace
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Turn Research Papers Into{" "}
              <span className="text-violet-600">
                Research Discoveries.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Organize research papers, explore literature with AI,
              compare scientific findings and discover potential
              research gaps — all in one place.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-4 font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
              >
                Start Exploring <ArrowRight size={18} />
              </Link>

              <a
                href="#features"
                className="rounded-xl border border-slate-200 bg-white px-7 py-4 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-2xl shadow-violet-100">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="font-bold">Research Workspace</p>
                  <p className="text-sm text-slate-400">
                    Your research at a glance
                  </p>
                </div>
                <BrainCircuit className="text-violet-600" size={32} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, label: "Research Papers" },
                  { icon: Sparkles, label: "AI Insights" },
                  { icon: GitCompareArrows, label: "Comparisons" },
                  { icon: Network, label: "Research Themes" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-violet-50 p-5"
                    >
                      <Icon className="mb-4 text-violet-600" size={25} />
                      <p className="text-sm font-semibold text-slate-700">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <ChartNoAxesCombined className="text-emerald-600" />
                  <div>
                    <p className="font-semibold">Research Gap Engine</p>
                    <p className="text-xs text-slate-400">
                      Explore recurring research limitations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-semibold uppercase tracking-widest text-violet-600">
            Everything in one place
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Your Complete Research Toolkit
          </h2>
          <p className="mt-4 leading-7 text-slate-500">
            From organizing literature to exploring potential research
            directions, simplify your research workflow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
              >
                <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-violet-100 text-violet-700">
                  <Icon size={24} />
                </div>

                <h3 className="text-lg font-bold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-violet-700 px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-bold md:text-4xl">
          Make Your Research Journey Smarter.
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-violet-100">
          Bring your literature, ideas and research workflow together
          with ResearchFlow.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-semibold text-violet-700 hover:bg-violet-50"
        >
          Get Started <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-7 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} ResearchFlow. Built for researchers.
      </footer>
    </div>
  );
}
