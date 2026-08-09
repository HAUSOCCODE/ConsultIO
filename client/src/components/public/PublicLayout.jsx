import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Brand from "../Brand";
export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="container-page flex h-20 items-center justify-between">
        <Link to="/">
          <Brand />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a className="transition hover:text-maroon-800" href="/#home">
            Home
          </a>
          <a className="transition hover:text-maroon-800" href="/#about">
            About
          </a>
          <a className="transition hover:text-maroon-800" href="/#features">
            Features
          </a>
          <Link to="/get-started" className="btn-primary !px-5 !py-2.5">
            Get Started
          </Link>
        </nav>
        <button
          onClick={() => setOpen(!open)}
          className="grid h-10 w-10 place-items-center rounded-lg border md:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-page space-y-1 border-t py-4 md:hidden">
          <a
            className="block rounded-lg px-3 py-3 font-semibold"
            href="/#home"
            onClick={() => setOpen(false)}
          >
            Home
          </a>
          <a
            className="block rounded-lg px-3 py-3 font-semibold"
            href="/#about"
            onClick={() => setOpen(false)}
          >
            About
          </a>
          <a
            className="block rounded-lg px-3 py-3 font-semibold"
            href="/#features"
            onClick={() => setOpen(false)}
          >
            Features
          </a>
          <Link className="btn-primary mt-2 w-full" to="/get-started">
            Get Started
          </Link>
        </nav>
      )}
    </header>
  );
}
export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-maroon-900 py-14 text-white">
      <div className="container-page flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Brand light />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-100">
            Faculty-student consultation made organized, accessible, and secure.
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="font-semibold text-white">School of Computing</p>
          <p className="text-slate-100">Holy Angel University</p>
          <p className="mt-3 text-xs text-slate-200">
            © {new Date().getFullYear()} ConsultIO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
