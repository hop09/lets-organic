'use client';

import { Check } from 'lucide-react';
import styles from './DentofitStory.module.css';

const TRUST_CARDS = [
  {
    title: 'Why Choose DentoFit?',
    text: 'DentoFit Organic Tooth Powder combines carefully selected natural ingredients with a science-informed approach to everyday oral care.',
    points: [
      ['Natural Ingredients', 'Nature-inspired oral care.'],
      ['Daily Oral Hygiene', 'Supports your everyday dental care routine.'],
      ['Convenient Powder Formula', 'A simple alternative to traditional toothpaste.'],
    ],
    foot: 'Nature-Inspired. Science-Driven.',
  },
  {
    title: 'Why Trust DentoFit?',
    text: 'Your Oral Care. Our Commitment to Quality. DentoFit Organic Tooth Powder brings together 12 carefully selected natural ingredients in a thoughtfully formulated approach to everyday oral care.',
    points: [
      ['12 Natural Ingredients', "Inspired by nature's botanical potential."],
      ['Quality You Can Value', 'A formulation built around thoughtful ingredient selection.'],
      ['Confidence in Every Brush', 'Make DentoFit part of your daily oral hygiene routine.'],
    ],
    foot: 'Nature-Inspired. Science-Driven. Quality-Focused.',
  },
  {
    title: 'Is DentoFit Safe?',
    text: 'DentoFit Organic Tooth Powder is crafted with 12 carefully selected natural ingredients for a nature-inspired approach to daily oral care.',
    points: [
      ['We Care About Your Oral Health', 'A nature-inspired approach to daily oral care.'],
      ['Where Dental Science Meets Natural Protection', 'Science-driven, quality-focused oral care.'],
    ],
    foot: 'Nature-Inspired. Science-Driven. Quality-Focused.',
  },
];

const HERBS = [
  { name: 'Mazo (Majith)', latin: 'Rubia cordifolia', benefits: ['Antimicrobial activity', 'Inhibits Streptococcus mutans', 'Reduces plaque formation', 'Supports gum health'] },
  { name: 'Calcium Carbonate (Cuttlefish Bone)', latin: 'Sepia officinalis', benefits: ['Removes surface stains', 'Rebuilds enamel minerals', 'Strengthens tooth structure', 'Supports natural whitening'] },
  { name: 'Batha', latin: 'Trianthema portulacastrum', benefits: ['Removes harmful oral microbes', 'Prevents infections', 'Soothes inflammation', 'Supports oral tissue healing'] },
  { name: 'Lodhra', latin: 'Symplocos racemosa', benefits: ['Strong antibacterial action', 'Reduces inflammation', 'Tightens and tones gums', 'Supports oral tissue health'] },
  { name: 'Clove', latin: 'Syzygium aromaticum', benefits: ['Natural analgesic (pain relief)', 'Antibacterial & antifungal', 'Reduces gum inflammation', 'Freshens breath'] },
  { name: 'Black Pepper', latin: 'Piper nigrum', benefits: ['Enhances nutrient absorption', 'Boosts circulation in gums', 'Has antimicrobial properties', 'Supports overall oral health'] },
  { name: 'Black Salt', latin: 'Sodium chloride (Halite)', benefits: ['Neutralizes acids', 'Strengthens gums', 'Maintains pH balance', 'Supports mineral balance'] },
  { name: 'Baking Soda', latin: 'Sodium bicarbonate', benefits: ['Neutralizes oral acidity', 'Removes plaque and stains', 'Prevents tooth decay', 'Maintains fresh breath'] },
  { name: 'Alum', latin: 'Potash alum (Potassium aluminium sulfate)', benefits: ['Astringent properties', 'Tightens gums', 'Reduces bleeding', 'Helps in tissue repair'] },
  { name: 'Aloe Vera Resin (Aqir-e-Qarha)', latin: 'Aloe barbadensis', benefits: ['Antimicrobial properties', 'Soothes gum inflammation', 'Promotes tissue regeneration', 'Reduces plaque buildup'] },
  { name: 'Miswak', latin: 'Salvadora persica', benefits: ['Strong antibacterial action', 'Prevents plaque buildup', 'Strengthens enamel', 'Reduces gum irritation'] },
  { name: 'Aqir-e-Qarha (Aromatic Resin)', latin: 'Aquilaria agallocha', benefits: ['Antimicrobial activity', 'Reduces bad breath', 'Soothes inflammation', 'Supports gum health'] },
];

const PROBLEMS = [
  'Tooth sensitivity — discomfort with hot or cold food',
  'Bleeding gums',
  'Bad breath',
  'Yellow or stained teeth',
];

const DIFFERENCES = [
  ['Active Herbal Penetration', 'Herbal ingredients work deep into gums and teeth.'],
  ['Foam Activation Technology', 'The foaming action during use carries ingredients to every tooth.'],
  ['Controlled Natural Abrasion', 'Cleans stains and plaque without harming enamel.'],
  ['Antimicrobial Action', 'Helps reduce the bacteria linked to bad breath and infections.'],
];

const TIMELINE = [
  ['First few days', 'Noticeable freshness'],
  ['1–2 weeks', 'Cleaner teeth'],
  ['Regular use', 'Stronger teeth'],
];

export default function DentofitStory() {
  return (
    <div className={styles.story}>
      {/* Tagline banner — off-white background, green font */}
      <section className={styles.taglineBanner}>
        <img
          src="/uploads/dentofit/dentofit-badge.jpg"
          alt="DentoFit — A Complete Dentist At Your Home"
          className={styles.taglineBadge}
          loading="lazy"
        />
        <h2 className={styles.taglineTitle}>A Complete Dentist At Your Home</h2>
        <p className={styles.taglineSub}>Use Twice a Day, Keep Dentist Away</p>
        <div className={styles.taglineChips}>
          <span className={styles.taglineChip}>100% Chemical Free</span>
          <span className={styles.taglineChip}>Money Back Guarantee – 100%</span>
          <span className={styles.taglineChip}>by Zuki&apos;s Organix</span>
        </div>
      </section>

      {/* Why Choose / Trust / Safe */}
      <section className={styles.trustSection}>
        <div className={styles.trustGrid}>
          {TRUST_CARDS.map((card) => (
            <article key={card.title} className={styles.trustCard}>
              <h3 className={styles.trustTitle}>{card.title}</h3>
              <p className={styles.trustText}>{card.text}</p>
              <ul className={styles.trustPoints}>
                {card.points.map(([title, detail]) => (
                  <li key={title}>
                    <strong>{title}</strong>
                    <span> — {detail}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.trustFoot}>{card.foot}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 12 herbs */}
      <section className={styles.herbsSection}>
        <h2 className={styles.sectionTitle}>12 Herbs &amp; Their Scientific Benefits</h2>
        <p className={styles.sectionSubtitle}>
          Twelve carefully selected natural ingredients, each chosen for a role in everyday oral care.
        </p>
        <div className={styles.herbsGrid}>
          {HERBS.map((herb, i) => (
            <article key={herb.name} className={styles.herbCard}>
              <div className={styles.herbHead}>
                <span className={styles.herbNum} aria-hidden="true">{i + 1}</span>
                <div>
                  <h3 className={styles.herbName}>{herb.name}</h3>
                  <p className={styles.herbLatin}>{herb.latin}</p>
                </div>
              </div>
              <ul className={styles.herbBenefits}>
                {herb.benefits.map((b) => (
                  <li key={b}>
                    <Check size={15} className={styles.herbCheck} aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Problem → solution */}
      <section className={styles.journeySection}>
        <h2 className={styles.sectionTitle}>From Problem to Solution</h2>

        <h3 className={styles.journeyHead}>Common oral problems</h3>
        <ul className={styles.problemList}>
          {PROBLEMS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <div className={styles.insightBox}>
          <h3 className={styles.journeyHead}>Why do these problems happen? (Scientific Insight)</h3>
          <p>
            Food particles, plaque and biofilm build up on tooth surfaces. This buildup is linked to
            sensitivity, gum problems and bacteria growth. Ordinary toothpaste cleans only the
            surface — it does not address the root buildup.
          </p>
        </div>

        <h3 className={styles.journeyHead}>What makes DentoFit different</h3>
        <div className={styles.diffGrid}>
          {DIFFERENCES.map(([title, detail]) => (
            <article key={title} className={styles.diffCard}>
              <h4>{title}</h4>
              <p>{detail}</p>
            </article>
          ))}
        </div>

        <h3 className={styles.journeyHead}>When will you feel the difference?</h3>
        <ol className={styles.timeline}>
          {TIMELINE.map(([when, what]) => (
            <li key={when}>
              <strong>{when}</strong>
              <span> — {what}</span>
            </li>
          ))}
        </ol>

        <p className={styles.journeyClose}>
          Not just cleaning — complete daily care. Where Dental Science Meets Natural Protection.
        </p>
      </section>
    </div>
  );
}
