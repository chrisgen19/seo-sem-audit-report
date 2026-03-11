import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Create demo user
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash,
    },
  });

  console.log("Created user:", user.email);

  // Create default organization and make user admin
  const org = await db.organization.upsert({
    where: { slug: "default" },
    update: {},
    create: { name: "My Organization", slug: "default" },
  });

  await db.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Created organization:", org.name);

  // Create a project
  const project = await db.project.create({
    data: {
      organizationId: org.id,
      name: "Example Site",
      domain: "https://example.com",
    },
  });

  console.log("Created project:", project.name);

  // Create pages
  const homePage = await db.page.create({
    data: {
      projectId: project.id,
      name: "Home",
      url: "https://example.com/",
    },
  });

  const aboutPage = await db.page.create({
    data: {
      projectId: project.id,
      name: "About Us",
      url: "https://example.com/about",
    },
  });

  console.log("Created pages:", homePage.name, aboutPage.name);

  // Create a completed audit run for the home page
  const auditRun = await db.auditRun.create({
    data: {
      pageId: homePage.id,
      url: homePage.url,
      status: "done",
      provider: "claude",
      overallScore: 72,
      overallGrade: "B",
      technicalScore: 78,
      technicalGrade: "B+",
      contentScore: 65,
      contentGrade: "C+",
      semScore: 74,
      semGrade: "B",
      completedAt: new Date(),
      checks: {
        create: [
          // Technical checks
          {
            section: "technical",
            name: "Page Speed",
            status: "PASS",
            finding: "Page loads in 1.8s which is within acceptable range.",
            recommendation: "Consider lazy loading images to further improve load time.",
          },
          {
            section: "technical",
            name: "Mobile Responsiveness",
            status: "PASS",
            finding: "Page renders correctly on mobile viewports.",
            recommendation: "No action needed.",
          },
          {
            section: "technical",
            name: "HTTPS",
            status: "PASS",
            finding: "Site is served over HTTPS with valid certificate.",
            recommendation: "No action needed.",
          },
          {
            section: "technical",
            name: "Structured Data",
            status: "WARN",
            finding: "Basic schema markup present but missing Organization and BreadcrumbList schemas.",
            recommendation: "Add Organization and BreadcrumbList structured data for better search appearance.",
          },
          {
            section: "technical",
            name: "Canonical Tags",
            status: "PASS",
            finding: "Canonical tags are properly set.",
            recommendation: "No action needed.",
          },
          {
            section: "technical",
            name: "XML Sitemap",
            status: "FAIL",
            finding: "No XML sitemap found at /sitemap.xml.",
            recommendation: "Generate and submit an XML sitemap to improve crawlability.",
          },
          // Content checks
          {
            section: "content",
            name: "Title Tag",
            status: "WARN",
            finding: "Title tag is 72 characters, slightly over the recommended 60 character limit.",
            recommendation: "Shorten the title tag to under 60 characters for optimal display in SERPs.",
          },
          {
            section: "content",
            name: "Meta Description",
            status: "PASS",
            finding: "Meta description is 148 characters and contains target keywords.",
            recommendation: "No action needed.",
          },
          {
            section: "content",
            name: "H1 Tag",
            status: "PASS",
            finding: "Single H1 tag present with relevant keywords.",
            recommendation: "No action needed.",
          },
          {
            section: "content",
            name: "Image Alt Text",
            status: "FAIL",
            finding: "5 of 12 images are missing alt text.",
            recommendation: "Add descriptive alt text to all images for accessibility and SEO.",
          },
          {
            section: "content",
            name: "Content Length",
            status: "WARN",
            finding: "Page has approximately 320 words. Recommended minimum is 500 words for homepage.",
            recommendation: "Expand content with relevant information about services and value proposition.",
          },
          // SEM checks
          {
            section: "sem",
            name: "Call to Action",
            status: "PASS",
            finding: "Clear CTA buttons present above the fold.",
            recommendation: "Consider A/B testing CTA copy for improved conversion.",
          },
          {
            section: "sem",
            name: "Landing Page Relevance",
            status: "WARN",
            finding: "Landing page content partially aligns with likely search intent.",
            recommendation: "Strengthen keyword-content alignment for primary target terms.",
          },
          {
            section: "sem",
            name: "Conversion Tracking",
            status: "FAIL",
            finding: "No conversion tracking pixels or event tracking detected.",
            recommendation: "Implement Google Ads conversion tracking and GA4 event tracking.",
          },
        ],
      },
      meta: {
        create: {
          businessName: "Example Corp",
          businessDesc: "A demo business for testing the SEO/SEM audit tool.",
          executiveSummary:
            "The site has a solid technical foundation with HTTPS and mobile responsiveness in place. Key areas for improvement include missing XML sitemap, incomplete image alt text, and lack of conversion tracking. Addressing these issues could significantly improve search visibility and conversion rates.",
          keyStrengths:
            "Fast page load speed, proper HTTPS implementation, mobile-friendly design, clear call-to-action placement.",
          keyOpportunities:
            "Add XML sitemap, fix missing image alt text, implement conversion tracking, expand thin content on homepage.",
          quickWins: [
            {
              title: "Add XML Sitemap",
              impact: "high",
              effort: "low",
              description: "Generate and submit an XML sitemap to Google Search Console.",
            },
            {
              title: "Fix Image Alt Text",
              impact: "medium",
              effort: "low",
              description: "Add descriptive alt text to the 5 images currently missing it.",
            },
            {
              title: "Install Conversion Tracking",
              impact: "high",
              effort: "medium",
              description: "Set up Google Ads conversion tracking and GA4 events.",
            },
          ],
          adGroups: [
            {
              name: "Brand Terms",
              keywords: ["example corp", "example company", "example services"],
              headlines: ["Example Corp - Official Site", "Trusted Services by Example Corp"],
              descriptions: ["Discover our professional services. Get started today."],
            },
            {
              name: "Service Terms",
              keywords: ["professional services", "business solutions", "consulting services"],
              headlines: ["Professional Business Solutions", "Expert Consulting Services"],
              descriptions: ["Top-rated business solutions tailored to your needs."],
            },
          ],
          priorityActions: {
            technical: ["Create and submit XML sitemap", "Add structured data markup"],
            content: ["Fix missing image alt text", "Expand homepage content to 500+ words"],
            sem: ["Implement conversion tracking", "Improve landing page keyword alignment"],
          },
          semStrengths: [
            "Clear CTA placement above the fold",
            "Fast page load benefits Quality Score",
          ],
          semIssues: [
            "No conversion tracking in place",
            "Landing page content weakly aligned with target keywords",
          ],
          campaignRecs: [
            "Set up brand campaign with exact match brand terms",
            "Create separate ad groups for each service category",
            "Implement remarketing audiences via GA4",
          ],
          rawCrawlData: {
            statusCode: 200,
            title: "Example Corp - Professional Business Solutions and Consulting Services Online",
            metaDescription:
              "Example Corp offers professional business solutions and consulting services. Contact us today to learn how we can help your business grow.",
            h1: ["Professional Business Solutions"],
            wordCount: 320,
            images: { total: 12, missingAlt: 5 },
            links: { internal: 8, external: 3 },
            loadTimeMs: 1800,
          },
        },
      },
    },
  });

  console.log("Created audit run:", auditRun.id);
  console.log("\nSeed complete!");
  console.log("Login with: demo@example.com / password123");
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
