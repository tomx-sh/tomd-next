import { DitheredPaint } from "@/components/dithered-paint";

function Grid() {
  return (
    <main className="grid h-dvh min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <article className="font-mono p-4">
        <p>
          <span className="font-bold">Hi!</span> <br />
          <span className="text-muted-foreground">
            My name is Thomas, I'm a software engineer based in France. <br />I
            help small teams design and build great apps for the web. <br />
            This website contains articles about profesionnal and personal
            project, as well as my resume. <br />
            Let's reach out!
          </span>
        </p>
      </article>
      <DitheredPaint className="min-h-0 min-w-0" />
    </main>
  );
}

export default function Home() {
  return <Grid />;
}
