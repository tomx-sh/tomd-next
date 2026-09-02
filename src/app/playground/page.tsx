import { DitheredFluid } from "@/components/dithered-fluid";

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
      <DitheredFluid className="min-h-0 min-w-0" />
    </main>
  );
}

function Full() {
  return (
    <main className="h-dvh min-h-0 w-full overflow-hidden markdown-page">
      <DitheredFluid className="absolute inset-0 z-0 size-full" />
      <article className="font-mono relative z-10">
        <p>
          Hi! <br />
          My name is Thomas, I'm a software engineer based in France. <br />I
          help small teams design and build great apps for the web. <br />
          This website contains articles about profesionnal and personal
          project, as well as my resume. <br />
          Let's reach out!
        </p>
      </article>
    </main>
  );
}

export default function Home() {
  return <Grid />;
}
