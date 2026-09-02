import { DitheredPortrait } from "@/components/dithered-portrait";

export default async function Home() {
  return (
    <main>
      <DitheredPortrait />
      <article className="relative z-10 font-pixel text-primary px-4 bg-background">
        <p>
          Hi! <br /> My name is Thomas, I'm a software engineer based in France.
          I help small teams design and build great apps for the web. This
          personal website contains articles about profesionnal and personal
          project, as well as my resume. Let's reach out!
        </p>
      </article>
    </main>
  );
}
