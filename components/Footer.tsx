import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo */}
          <div>
            <Link href="/" className="font-medium tracking-tight lowercase">
              recruitos
            </Link>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm text-muted-foreground mb-4 lowercase">
              resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  about
                </Link>
              </li>
              <li>
                <Link
                  href="/contributors"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  contributors
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm text-muted-foreground mb-4 lowercase">
              company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  contact
                </Link>
              </li>
              <li>
                <a
                  href="mailto:nars@recruitos.dev"
                  className="text-sm text-foreground hover:text-primary transition-colors lowercase"
                >
                  nars@recruitos.dev
                </a>
              </li>
            </ul>
          </div>

          {/* Empty for alignment */}
          <div />
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground lowercase">
            © {new Date().getFullYear()} recruitos. all rights reserved.
          </p>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            $
          </Link>
        </div>
      </div>
    </footer>
  );
}
