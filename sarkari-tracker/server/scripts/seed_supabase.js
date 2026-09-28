import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Ashrith.h.n.%4018@db.kiqrxoxbdejmxwqffxcw.supabase.co:5432/postgres';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedSupabase() {
  console.log('Connecting to Supabase PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to Supabase!');

    // 1. Seed Users
    const hashedPasswordAdmin = bcrypt.hashSync('admin123', 10);
    const hashedPasswordUser = bcrypt.hashSync('student123', 10);

    await client.query(`
      INSERT INTO users (name, email, phone, password, is_admin)
      VALUES 
        ('Sarkari Admin', 'admin@sarkari.in', '9999999999', $1, true),
        ('Candidate Aspirant', 'student@sarkari.in', '9888888888', $2, false)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPasswordAdmin, hashedPasswordUser]);
    console.log('✓ Seeded admin and student accounts');

    // 2. Seed Official Exams
    const registryPath = path.join(__dirname, '../data/examRegistry.json');
    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      const usedSlugs = new Set();

      for (const e of registry) {
        let baseSlug = slugify(e.short_name || e.name);
        let finalSlug = baseSlug;
        let counter = 1;
        while (usedSlugs.has(finalSlug)) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        usedSlugs.add(finalSlug);

        await client.query(`
          INSERT INTO exams (
            name, short_name, conducting_body, level, state, category,
            official_site, careers_url, notification_url, results_url,
            admit_card_url, syllabus_source_url, frequency, scrape_frequency,
            adapter_type, is_active, data_status, slug
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'empty', $17)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            conducting_body = EXCLUDED.conducting_body,
            category = EXCLUDED.category,
            official_site = EXCLUDED.official_site;
        `, [
          e.name, e.short_name, e.conducting_body, e.level || 'central', e.state || null, e.category,
          e.official_site, e.careers_url || null, e.notification_url || null, e.results_url || null,
          e.admit_card_url || null, e.syllabus_source_url || null, e.frequency || 'annual', e.scrape_frequency || 360,
          e.adapter_type || 'generic', e.active !== false, finalSlug
        ]);
      }
      console.log(`✓ Seeded ${registry.length} official exams into Supabase`);
    }

    // 3. Seed SEO Blogs
    const blogs = [
      {
        title: 'UPSC Civil Services 2026: Strategy, Prelims & Mains Syllabus, Cutoff Analysis',
        slug: 'upsc-cse-2026-complete-strategy-syllabus-cutoffs',
        excerpt: 'A comprehensive roadmap for UPSC CSE 2026 aspirants covering booklists, phase-wise revision plans, official Prelims cutoffs, and answer writing methodologies.',
        content: `# UPSC Civil Services Examination 2026: Complete Strategy Guide\n\nThe Union Public Service Commission (UPSC) Civil Services Examination remains India's premier gateway to prestigious administrative roles including IAS, IPS, IFS, and IRS.`,
        category: 'UPSC',
        meta_title: 'UPSC CSE 2026 Strategy, Syllabus & Official Cutoffs | SarkariTracker',
        meta_description: 'Complete guide for UPSC Civil Services 2026 preparation.',
        keywords: 'UPSC CSE 2026, IAS Exam, UPSC Syllabus, UPSC Cutoff',
        reading_time: 8
      },
      {
        title: 'Karnataka KEA & KPSC Recruitment 2026: VAO, KAS, and Board Exam Calendar',
        slug: 'karnataka-kea-kpsc-recruitment-2026-calendar-guide',
        excerpt: 'Everything you need to know about upcoming Karnataka Examination Authority (KEA) and KPSC recruitment notices for Village Administrative Officers, FDA, SDA, and KAS.',
        content: `# Karnataka State Government Examinations (KEA & KPSC) 2026\n\nThe Karnataka Examination Authority (KEA) and Karnataka Public Service Commission (KPSC) conduct major recruitment drives for state departments.`,
        category: 'Karnataka',
        meta_title: 'Karnataka KEA & KPSC Recruitment 2026: Exam Calendar & Syllabus',
        meta_description: 'Official updates on Karnataka KEA VAO, KPSC KAS, FDA, SDA examinations.',
        keywords: 'KEA Recruitment 2026, KPSC KAS 2026, Karnataka VAO Exam',
        reading_time: 7
      },
      {
        title: 'SSC CGL 2026: Tier 1 & Tier 2 Preparation Strategy, Vacancies & Cutoff Analysis',
        slug: 'ssc-cgl-2026-tier-1-tier-2-strategy-vacancies',
        excerpt: 'Comprehensive analysis of Staff Selection Commission Combined Graduate Level (SSC CGL) exam pattern, revised syllabus, and category-wise qualifying cutoffs.',
        content: `# SSC CGL 2026: Ultimate Preparation Blueprint\n\nThe Staff Selection Commission (SSC) Combined Graduate Level (CGL) examination recruits candidates for Group B and C posts across central ministries and departments.`,
        category: 'SSC',
        meta_title: 'SSC CGL 2026 Tier 1 & Tier 2 Blueprint: Strategy & Vacancies',
        meta_description: 'Master SSC CGL 2026 with verified syllabus breakdown.',
        keywords: 'SSC CGL 2026, SSC Notification, SSC CGL Syllabus',
        reading_time: 6
      }
    ];

    for (const b of blogs) {
      await client.query(`
        INSERT INTO blog_posts (title, slug, excerpt, content, author, category, is_published, meta_title, meta_description, keywords, reading_time_minutes)
        VALUES ($1, $2, $3, $4, 'SarkariTracker Editorial Desk', $5, true, $6, $7, $8, $9)
        ON CONFLICT (slug) DO NOTHING;
      `, [b.title, b.slug, b.excerpt, b.content, b.category, b.meta_title, b.meta_description, b.keywords, b.reading_time]);
    }
    console.log('✓ Seeded SEO blog posts into Supabase');

    const totalExams = await client.query('SELECT COUNT(*) FROM exams');
    const totalUsers = await client.query('SELECT COUNT(*) FROM users');
    const totalBlogs = await client.query('SELECT COUNT(*) FROM blog_posts');
    console.log(`\n🎉 Supabase Database Successfully Seeded!`);
    console.log(`   - Exams: ${totalExams.rows[0].count}`);
    console.log(`   - Users: ${totalUsers.rows[0].count}`);
    console.log(`   - Blogs: ${totalBlogs.rows[0].count}`);

    await client.end();
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seedSupabase();
