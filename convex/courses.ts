import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// All 60+ college courses seed data
const COURSES_SEED = [
  // Sciences
  { name: "Biology", department: "Sciences", description: "Study of living organisms and life processes", icon: "🧬", color: "#16A34A" },
  { name: "Chemistry", department: "Sciences", description: "Study of matter, substances, and reactions", icon: "⚗️", color: "#CA8A04" },
  { name: "Physics", department: "Sciences", description: "Study of matter, energy, and fundamental forces", icon: "⚛️", color: "#7C3AED" },
  { name: "Mathematics", department: "Sciences", description: "Pure and applied mathematics", icon: "📐", color: "#2563EB" },
  { name: "Statistics", department: "Sciences", description: "Data analysis and probability theory", icon: "📊", color: "#0891B2" },
  { name: "Environmental Science", department: "Sciences", description: "Study of the environment and ecological systems", icon: "🌍", color: "#15803D" },
  // Engineering
  { name: "Civil Engineering", department: "Engineering", description: "Design and construction of infrastructure", icon: "🏗️", color: "#B45309" },
  { name: "Mechanical Engineering", department: "Engineering", description: "Design and analysis of mechanical systems", icon: "⚙️", color: "#6B7280" },
  { name: "Electrical Engineering", department: "Engineering", description: "Electrical systems and electronics", icon: "⚡", color: "#D97706" },
  { name: "Electronics Engineering", department: "Engineering", description: "Electronic circuits and communication", icon: "📡", color: "#0891B2" },
  { name: "Chemical Engineering", department: "Engineering", description: "Chemical processes and plant design", icon: "🧪", color: "#9333EA" },
  { name: "Computer Engineering", department: "Engineering", description: "Hardware and software systems", icon: "💻", color: "#2563EB" },
  { name: "Industrial Engineering", department: "Engineering", description: "Optimization of complex systems and processes", icon: "🏭", color: "#64748B" },
  { name: "Geodetic Engineering", department: "Engineering", description: "Measurement and mapping of the earth", icon: "🗺️", color: "#16A34A" },
  { name: "Mining Engineering", department: "Engineering", description: "Extraction of mineral resources", icon: "⛏️", color: "#78350F" },
  { name: "Architecture", department: "Engineering", description: "Design of buildings and structures", icon: "🏛️", color: "#C2410C" },
  // IT & Computer
  { name: "Computer Science", department: "IT & Computer", description: "Algorithms, data structures, and theory of computation", icon: "🖥️", color: "#1D4ED8" },
  { name: "Information Technology", department: "IT & Computer", description: "Managing and implementing technology solutions", icon: "🌐", color: "#0284C7" },
  { name: "Information Systems", department: "IT & Computer", description: "Business-oriented information management", icon: "🗄️", color: "#0E7490" },
  { name: "Data Science", department: "IT & Computer", description: "Big data, machine learning, and analytics", icon: "📈", color: "#7C3AED" },
  { name: "Cybersecurity", department: "IT & Computer", description: "Network security and digital defense", icon: "🔐", color: "#DC2626" },
  { name: "Artificial Intelligence", department: "IT & Computer", description: "AI, ML, and intelligent systems", icon: "🤖", color: "#6D28D9" },
  // Medicine & Health
  { name: "Medicine", department: "Medicine & Health", description: "Clinical medicine and patient care", icon: "🩺", color: "#DC2626" },
  { name: "Nursing", department: "Medicine & Health", description: "Patient care and clinical nursing practice", icon: "💉", color: "#BE185D" },
  { name: "Pharmacy", department: "Medicine & Health", description: "Drug science and pharmaceutical care", icon: "💊", color: "#7C3AED" },
  { name: "Medical Technology", department: "Medicine & Health", description: "Laboratory diagnostics and testing", icon: "🔬", color: "#0891B2" },
  { name: "Physical Therapy", department: "Medicine & Health", description: "Rehabilitation and movement therapy", icon: "🏃", color: "#16A34A" },
  { name: "Dentistry", department: "Medicine & Health", description: "Oral health and dental care", icon: "🦷", color: "#0D9488" },
  { name: "Nutrition & Dietetics", department: "Medicine & Health", description: "Food science and nutritional health", icon: "🥗", color: "#65A30D" },
  { name: "Public Health", department: "Medicine & Health", description: "Community health and disease prevention", icon: "🏥", color: "#DC2626" },
  { name: "Radiology", department: "Medicine & Health", description: "Medical imaging and radiation therapy", icon: "🩻", color: "#1E40AF" },
  { name: "Veterinary Medicine", department: "Agriculture", description: "Animal health and veterinary care", icon: "🐾", color: "#78350F" },
  // Business
  { name: "Accountancy", department: "Business", description: "Financial accounting and auditing", icon: "📒", color: "#1D4ED8" },
  { name: "Business Administration", department: "Business", description: "Management and organizational leadership", icon: "💼", color: "#374151" },
  { name: "Economics", department: "Business", description: "Microeconomics, macroeconomics, and policy", icon: "📉", color: "#0891B2" },
  { name: "Marketing", department: "Business", description: "Consumer behavior and marketing strategy", icon: "📣", color: "#EA580C" },
  { name: "Finance", department: "Business", description: "Financial markets and investment analysis", icon: "💰", color: "#CA8A04" },
  { name: "Entrepreneurship", department: "Business", description: "Startup creation and business innovation", icon: "🚀", color: "#7C3AED" },
  { name: "Human Resource Management", department: "Business", description: "People management and organizational development", icon: "👥", color: "#2563EB" },
  { name: "Tourism Management", department: "Business", description: "Travel, tourism, and hospitality industry", icon: "✈️", color: "#0891B2" },
  { name: "Hospitality Management", department: "Business", description: "Hotel, restaurant, and event management", icon: "🏨", color: "#D97706" },
  // Law
  { name: "Juris Doctor", department: "Law", description: "Professional law degree and legal practice", icon: "⚖️", color: "#1E3A8A" },
  { name: "Criminology", department: "Law", description: "Crime, criminal behavior, and law enforcement", icon: "🔍", color: "#374151" },
  { name: "Political Science", department: "Law", description: "Government, politics, and public policy", icon: "🏛️", color: "#1D4ED8" },
  { name: "International Relations", department: "Law", description: "Diplomacy, foreign policy, and global affairs", icon: "🌏", color: "#0891B2" },
  // Education
  { name: "Elementary Education", department: "Education", description: "Teaching methodologies for primary school", icon: "✏️", color: "#16A34A" },
  { name: "Secondary Education", department: "Education", description: "Teaching for high school subjects", icon: "📚", color: "#2563EB" },
  { name: "Special Education", department: "Education", description: "Inclusive education for learners with special needs", icon: "🌟", color: "#D97706" },
  { name: "Physical Education", department: "Education", description: "Sports science and physical activity education", icon: "⚽", color: "#16A34A" },
  // Arts & Communication
  { name: "Fine Arts", department: "Arts & Communication", description: "Visual arts, painting, and sculpture", icon: "🎨", color: "#EC4899" },
  { name: "Graphic Design", department: "Arts & Communication", description: "Visual communication and digital design", icon: "✏️", color: "#7C3AED" },
  { name: "Interior Design", department: "Arts & Communication", description: "Design of interior spaces and environments", icon: "🛋️", color: "#D97706" },
  { name: "Journalism", department: "Arts & Communication", description: "News writing, reporting, and media literacy", icon: "📰", color: "#1D4ED8" },
  { name: "Communication Arts", department: "Arts & Communication", description: "Mass communication and media studies", icon: "📢", color: "#0891B2" },
  { name: "Film & Broadcast Arts", department: "Arts & Communication", description: "Filmmaking, cinematography, and production", icon: "🎬", color: "#374151" },
  { name: "Music", department: "Arts & Communication", description: "Music theory, performance, and composition", icon: "🎵", color: "#7C3AED" },
  { name: "Theater Arts", department: "Arts & Communication", description: "Acting, directing, and dramatic arts", icon: "🎭", color: "#DC2626" },
  // Social Sciences
  { name: "Psychology", department: "Social Sciences", description: "Human behavior, cognition, and mental health", icon: "🧠", color: "#7C3AED" },
  { name: "Sociology", department: "Social Sciences", description: "Society, social structures, and group behavior", icon: "🌐", color: "#0891B2" },
  { name: "Social Work", department: "Social Sciences", description: "Community development and social services", icon: "🤝", color: "#16A34A" },
  { name: "Anthropology", department: "Social Sciences", description: "Human cultures, evolution, and societies", icon: "🦴", color: "#78350F" },
  { name: "Philosophy", department: "Social Sciences", description: "Logic, ethics, and metaphysics", icon: "💭", color: "#374151" },
  { name: "History", department: "Social Sciences", description: "World and Philippine history", icon: "🏺", color: "#B45309" },
  // Agriculture
  { name: "Agriculture", department: "Agriculture", description: "Crop science and farm management", icon: "🌾", color: "#65A30D" },
  { name: "Forestry", department: "Agriculture", description: "Forest management and conservation", icon: "🌳", color: "#15803D" },
  { name: "Fisheries", department: "Agriculture", description: "Aquaculture and fisheries management", icon: "🐟", color: "#0891B2" },
  // Graduate
  { name: "MBA", department: "Graduate Programs", description: "Master of Business Administration", icon: "🎓", color: "#1D4ED8" },
  { name: "MPA", department: "Graduate Programs", description: "Master of Public Administration", icon: "🏛️", color: "#374151" },
];

export const seedCourses = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("courses").first();
    if (existing) return { message: "Already seeded" };

    for (const course of COURSES_SEED) {
      await ctx.db.insert("courses", { ...course, memberCount: 0 });
    }
    return { message: `Seeded ${COURSES_SEED.length} courses` };
  },
});

export const listAll = query({
  args: { search: v.optional(v.string()), department: v.optional(v.string()) },
  handler: async (ctx, { search, department }) => {
    let courses = await ctx.db.query("courses").collect();

    if (department) {
      courses = courses.filter((c) => c.department === department);
    }
    if (search) {
      const q = search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    return courses;
  },
});

export const getById = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    return ctx.db.get(courseId);
  },
});

export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    const depts = [...new Set(courses.map((c) => c.department))];
    return depts;
  },
});
