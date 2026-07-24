/**
 * NCERT official catalog metadata — server-side only.
 *
 * Source: https://ncert.nic.in (official NCERT website)
 * All books are freely available at ncert.nic.in — copyright_status = official_open.
 *
 * This file contains the curated metadata for NCERT books relevant to UPSC.
 * External URLs point to the official NCERT PDF download pages only.
 * No PDFs are fetched or stored in R2. Users download directly from NCERT.
 */

export interface NcertBook {
  title: string;
  subject_area: string;
  category: string;
  /** Official NCERT download page URL (not direct PDF URL) */
  official_page_url: string;
  /** Direct PDF URL from ncert.nic.in — linked but NOT auto-downloaded */
  pdf_url: string | null;
  class: number;
}

/** All UPSC-relevant NCERT books with official ncert.nic.in links */
export const NCERT_CATALOG: NcertBook[] = [
  // ── History ─────────────────────────────────────────────────────────────────
  {
    title: "Class 6 History - Our Pasts I (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?fess1=0-10",
    pdf_url: "https://ncert.nic.in/textbook/pdf/fess1.zip",
    class: 6,
  },
  {
    title: "Class 7 History - Our Pasts II (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?gess1=0-9",
    pdf_url: "https://ncert.nic.in/textbook/pdf/gess1.zip",
    class: 7,
  },
  {
    title: "Class 8 History - Our Pasts III (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?hess1=0-11",
    pdf_url: "https://ncert.nic.in/textbook/pdf/hess1.zip",
    class: 8,
  },
  {
    title: "Class 9 History - India and the Contemporary World I (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?iess2=0-5",
    pdf_url: "https://ncert.nic.in/textbook/pdf/iess2.zip",
    class: 9,
  },
  {
    title: "Class 10 History - India and the Contemporary World II (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?jess3=0-5",
    pdf_url: "https://ncert.nic.in/textbook/pdf/jess3.zip",
    class: 10,
  },
  {
    title: "Class 11 History - Themes in World History (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?kehh1=0-15",
    pdf_url: "https://ncert.nic.in/textbook/pdf/kehh1.zip",
    class: 11,
  },
  {
    title: "Class 12 History - Themes in Indian History Part I (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?lehh1=0-5",
    pdf_url: "https://ncert.nic.in/textbook/pdf/lehh1.zip",
    class: 12,
  },
  {
    title: "Class 12 History - Themes in Indian History Part II (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?lehh2=0-5",
    pdf_url: "https://ncert.nic.in/textbook/pdf/lehh2.zip",
    class: 12,
  },
  {
    title: "Class 12 History - Themes in Indian History Part III (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / History",
    official_page_url: "https://ncert.nic.in/textbook.php?lehh3=0-5",
    pdf_url: "https://ncert.nic.in/textbook/pdf/lehh3.zip",
    class: 12,
  },

  // ── Geography ────────────────────────────────────────────────────────────────
  {
    title: "Class 6 Geography - The Earth: Our Habitat (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?fess2=0-8",
    pdf_url: "https://ncert.nic.in/textbook/pdf/fess2.zip",
    class: 6,
  },
  {
    title: "Class 7 Geography - Our Environment (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?gess2=0-9",
    pdf_url: "https://ncert.nic.in/textbook/pdf/gess2.zip",
    class: 7,
  },
  {
    title: "Class 8 Geography - Resource and Development (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?hess2=0-6",
    pdf_url: "https://ncert.nic.in/textbook/pdf/hess2.zip",
    class: 8,
  },
  {
    title: "Class 9 Geography - Contemporary India I (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?iess1=0-6",
    pdf_url: "https://ncert.nic.in/textbook/pdf/iess1.zip",
    class: 9,
  },
  {
    title: "Class 10 Geography - Contemporary India II (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?jess1=0-7",
    pdf_url: "https://ncert.nic.in/textbook/pdf/jess1.zip",
    class: 10,
  },
  {
    title: "Class 11 Geography Part 1 - Fundamentals of Physical Geography (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?kefg1=0-7",
    pdf_url: "https://ncert.nic.in/textbook/pdf/kefg1.zip",
    class: 11,
  },
  {
    title: "Class 11 Geography Part 2 - India: Physical Environment (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?kefg2=0-8",
    pdf_url: "https://ncert.nic.in/textbook/pdf/kefg2.zip",
    class: 11,
  },
  {
    title: "Class 12 Geography Part 1 - Fundamentals of Human Geography (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?lefg1=0-8",
    pdf_url: "https://ncert.nic.in/textbook/pdf/lefg1.zip",
    class: 12,
  },
  {
    title: "Class 12 Geography Part 2 - India People and Economy (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Geography",
    official_page_url: "https://ncert.nic.in/textbook.php?lefg2=0-9",
    pdf_url: "https://ncert.nic.in/textbook/pdf/lefg2.zip",
    class: 12,
  },

  // ── Polity / Political Science ───────────────────────────────────────────────
  {
    title: "Class 6 Civics - Social and Political Life I (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS2 / Polity",
    official_page_url: "https://ncert.nic.in/textbook.php?fess3=0-8",
    pdf_url: "https://ncert.nic.in/textbook/pdf/fess3.zip",
    class: 6,
  },
  {
    title: "Class 7 Civics - Social and Political Life II (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS2 / Polity",
    official_page_url: "https://ncert.nic.in/textbook.php?gess3=0-9",
    pdf_url: "https://ncert.nic.in/textbook/pdf/gess3.zip",
    class: 7,
  },
  {
    title: "Class 8 Civics - Social and Political Life III (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS2 / Polity",
    official_page_url: "https://ncert.nic.in/textbook.php?hess3=0-9",
    pdf_url: "https://ncert.nic.in/textbook/pdf/hess3.zip",
    class: 8,
  },
  {
    title: "Class 9 Political Science - Democratic Politics I (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS2 / Polity",
    official_page_url: "https://ncert.nic.in/textbook.php?iess4=0-8",
    pdf_url: "https://ncert.nic.in/textbook/pdf/iess4.zip",
    class: 9,
  },
  {
    title: "Class 10 Political Science - Democratic Politics II (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS2 / Polity",
    official_page_url: "https://ncert.nic.in/textbook.php?jess4=0-8",
    pdf_url: "https://ncert.nic.in/textbook/pdf/jess4.zip",
    class: 10,
  },
  {
    title: "Class 11 Political Science - Indian Constitution at Work (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS2 / Polity",
    official_page_url: "https://ncert.nic.in/textbook.php?keps1=0-10",
    pdf_url: "https://ncert.nic.in/textbook/pdf/keps1.zip",
    class: 11,
  },
  {
    title: "Class 12 Political Science - Contemporary World Politics (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS2 / Polity",
    official_page_url: "https://ncert.nic.in/textbook.php?leps1=0-9",
    pdf_url: "https://ncert.nic.in/textbook/pdf/leps1.zip",
    class: 12,
  },

  // ── Economics ────────────────────────────────────────────────────────────────
  {
    title: "Class 9 Economics - Economics (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS3 / Economy",
    official_page_url: "https://ncert.nic.in/textbook.php?iess3=0-4",
    pdf_url: "https://ncert.nic.in/textbook/pdf/iess3.zip",
    class: 9,
  },
  {
    title: "Class 10 Economics - Understanding Economic Development (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS3 / Economy",
    official_page_url: "https://ncert.nic.in/textbook.php?jess2=0-4",
    pdf_url: "https://ncert.nic.in/textbook/pdf/jess2.zip",
    class: 10,
  },
  {
    title: "Class 11 Economics - Indian Economic Development (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS3 / Economy",
    official_page_url: "https://ncert.nic.in/textbook.php?keec1=0-9",
    pdf_url: "https://ncert.nic.in/textbook/pdf/keec1.zip",
    class: 11,
  },
  {
    title: "Class 12 Economics - Introductory Macroeconomics (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS3 / Economy",
    official_page_url: "https://ncert.nic.in/textbook.php?leec2=0-6",
    pdf_url: "https://ncert.nic.in/textbook/pdf/leec2.zip",
    class: 12,
  },

  // ── Science & Technology ─────────────────────────────────────────────────────
  {
    title: "Class 11 Biology (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS3 / Science & Tech",
    official_page_url: "https://ncert.nic.in/textbook.php?kebo1=0-22",
    pdf_url: "https://ncert.nic.in/textbook/pdf/kebo1.zip",
    class: 11,
  },

  // ── Sociology ────────────────────────────────────────────────────────────────
  {
    title: "Class 11 Sociology - Introducing Sociology (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Indian Society",
    official_page_url: "https://ncert.nic.in/textbook.php?keso1=0-5",
    pdf_url: "https://ncert.nic.in/textbook/pdf/keso1.zip",
    class: 11,
  },
  {
    title: "Class 12 Sociology - Indian Society (NCERT)",
    subject_area: "NCERT Foundation",
    category: "GS1 / Indian Society",
    official_page_url: "https://ncert.nic.in/textbook.php?leso1=0-6",
    pdf_url: "https://ncert.nic.in/textbook/pdf/leso1.zip",
    class: 12,
  },
];
