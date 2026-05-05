import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 px-4 pb-8 pt-2 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center justify-center">
        <p className="text-center text-xs tracking-[0.18em] text-muted-foreground/70 transition-colors duration-200 hover:text-muted-foreground/90">
          Built by{" "}
          <Link
            href="#"
            className="font-medium text-muted-foreground/80 underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline"
          >
            DumpyDon
          </Link>
        </p>
      </div>
    </footer>
  );
}
