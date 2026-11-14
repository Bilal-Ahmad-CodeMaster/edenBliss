import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Questions",
  description: "Delivery, fit, and cash on delivery at Eden Bliss.",
  openGraph: {
    title: "Questions · Eden Bliss",
    description: "Delivery, fit, and cash on delivery at Eden Bliss.",
  },
};

export const revalidate = 60;

const questions = [
  ["How do I pay?", "Cash on delivery is the only method. The courier collects the amount when the parcel reaches you."],
  ["How are sizes written?", "Every size is published in metres, centimetres, and inches. The letter on the label is only a starting point."],
  ["Can I ask for a fit note?", "Yes. Waist, height, and hem notes travel with the order and are read before the piece is sent."],
  ["When does shipping become complimentary?", "Once the order passes the threshold published in the house settings. The exact figure is calculated on the server, never from the browser."],
];

export default function FaqPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Questions</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">Before you order.</h1>
      <dl className="mt-10 space-y-8">
        {questions.map(([question, answer]) => (
          <div key={question} className="border-t border-line pt-6">
            <dt className="font-serif text-3xl">{question}</dt>
            <dd className="mt-3 text-sm leading-7 text-muted">{answer}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
