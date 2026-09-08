// Template auto-fill (Task 3, scoped): a curated set of starting-point SEO
// copy per page type. Placeholders use [Bracket Text] directly inside the
// title/description/keywords — there's no separate placeholder-fill modal,
// because the SEO panel's own title/description/keywords inputs already
// are the editable surface. Applying a template just seeds those fields;
// the user replaces the brackets the same way they'd write the copy from
// scratch. seoScore.js flags any bracket left unfilled so it doesn't slip
// through unnoticed.
export const SEO_TEMPLATES = [
  {
    id: "saas", label: "SaaS / Software",
    title: "[Product Name] — [Category] Software for [Industry]",
    description: "[Product Name] helps [business type] streamline [key workflow] and get more done. Try it free, no credit card required.",
    keywords: "saas, software, automation, productivity",
    ogType: "website", schemaType: "SoftwareApplication",
  },
  {
    id: "ecommerce", label: "E-commerce / Product",
    title: "[Product Name] — Buy Online | [Brand]",
    description: "Shop [Product Name]. [One-line product description]. Free shipping on orders over [$X], easy returns.",
    keywords: "buy [product], [brand], online store, free shipping",
    ogType: "product", schemaType: "Product",
  },
  {
    id: "agency", label: "Service / Agency",
    title: "[Agency Name] — [Service] for [Client Type]",
    description: "[Agency Name] is a [service] agency helping [client type] achieve [outcome]. Get a free consultation today.",
    keywords: "[service] agency, [industry] consulting, [city]",
    ogType: "website", schemaType: "Organization",
  },
  {
    id: "local-business", label: "Local Business",
    title: "[Business Name] — [Service] in [City]",
    description: "[Business Name] offers [services] in [City]. Call [phone] or visit us today — [hours/address].",
    keywords: "[service] [city], local [business type], near me",
    ogType: "website", schemaType: "LocalBusiness",
  },
  {
    id: "blog", label: "Blog / News",
    title: "[Article Title] — [Blog/Publication Name]",
    description: "[One or two sentence summary of the article's main point, written to make someone want to click through and read it.]",
    keywords: "[topic], [subtopic], [related keyword]",
    ogType: "article", schemaType: "BlogPosting",
  },
  {
    id: "portfolio", label: "Portfolio / Freelancer",
    title: "[Your Name] — [Specialty] | Portfolio",
    description: "[Your Name] is a [specialty] based in [city]. Browse recent work and get in touch for [type of project].",
    keywords: "[specialty] portfolio, [your name], freelance [specialty]",
    ogType: "website", schemaType: "Person",
  },
  {
    id: "restaurant", label: "Restaurant / Hospitality",
    title: "[Restaurant Name] — [Cuisine] in [City]",
    description: "[Restaurant Name] serves [cuisine] in [City]. View our menu, book a table, or order online.",
    keywords: "[cuisine] restaurant [city], book a table, [restaurant name]",
    ogType: "website", schemaType: "Restaurant",
  },
  {
    id: "real-estate", label: "Real Estate",
    title: "[Property Name/Type] in [Neighborhood], [City]",
    description: "[Bedrooms]-bed [property type] in [neighborhood]. [Key feature]. Contact [agent name] to schedule a viewing.",
    keywords: "[neighborhood] real estate, homes for sale [city], [property type]",
    ogType: "website", schemaType: "RealEstateListing",
  },
  {
    id: "course", label: "Educational / Course",
    title: "[Course Name] — Learn [Skill] Online",
    description: "[Course Name] teaches you [skill] through [format, e.g. hands-on projects]. [Duration], [level]. Enroll today.",
    keywords: "learn [skill], [skill] course, online course",
    ogType: "website", schemaType: "Course",
  },
  {
    id: "community", label: "Community / Forum",
    title: "[Community Name] — [Topic] Community",
    description: "[Community Name] is where [audience] discuss [topic]. Join [member count]+ members already there.",
    keywords: "[topic] community, [topic] forum, join [community name]",
    ogType: "website", schemaType: "Organization",
  },
];
