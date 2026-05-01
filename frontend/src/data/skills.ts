export interface SkillCategory {
  label: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    label: 'Development',
    skills: [
      // Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'Ruby',
      'PHP', 'Swift', 'Kotlin', 'Scala', 'Dart', 'Elixir', 'Haskell', 'Lua', 'R', 'MATLAB',
      'Perl', 'Groovy', 'Clojure', 'F#', 'Erlang', 'Julia', 'Solidity', 'Bash', 'PowerShell', 'Assembly',
      // Frontend
      'React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit', 'Remix', 'Gatsby',
      'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Sass', 'Less', 'Styled Components', 'Emotion',
      'Redux', 'Zustand', 'MobX', 'Recoil', 'Jotai', 'Vite', 'Webpack', 'Rollup', 'Parcel', 'esbuild',
      'React Query', 'SWR', 'tRPC', 'GraphQL Client', 'Apollo Client', 'Urql',
      'Framer Motion', 'GSAP', 'Three.js', 'D3.js', 'Chart.js', 'Recharts',
      'Storybook', 'Chromatic', 'Jest', 'React Testing Library', 'Cypress', 'Playwright',
      'WebSockets', 'WebRTC', 'Service Workers', 'PWA', 'Web Components',
      // Backend
      'Node.js', 'Express.js', 'Fastify', 'NestJS', 'Hono', 'Koa', 'Hapi',
      'Django', 'Flask', 'FastAPI', 'Tornado', 'Starlette', 'Litestar',
      'Spring Boot', 'Spring MVC', 'Quarkus', 'Micronaut', 'Vert.x',
      'Ruby on Rails', 'Sinatra', 'Hanami',
      'Laravel', 'Symfony', 'CodeIgniter', 'Lumen', 'Slim',
      'ASP.NET Core', 'Blazor', 'SignalR',
      'Gin', 'Echo', 'Fiber', 'Chi',
      'Phoenix', 'Plug', 'Ecto',
      'GraphQL', 'REST API', 'gRPC', 'WebSocket', 'MQTT', 'AMQP',
      // Databases
      'PostgreSQL', 'MySQL', 'SQLite', 'MariaDB', 'Oracle DB', 'SQL Server',
      'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'CouchDB', 'RavenDB',
      'Elasticsearch', 'OpenSearch', 'Solr', 'Meilisearch', 'Typesense',
      'Neo4j', 'ArangoDB', 'FaunaDB', 'SurrealDB', 'PlanetScale', 'Neon',
      'Prisma', 'Drizzle ORM', 'TypeORM', 'Sequelize', 'Mongoose', 'SQLAlchemy',
      'Supabase', 'Firebase Firestore', 'PocketBase',
      // DevOps & Cloud
      'Docker', 'Kubernetes', 'Helm', 'Terraform', 'Pulumi', 'Ansible', 'Chef', 'Puppet',
      'AWS', 'Google Cloud', 'Azure', 'DigitalOcean', 'Vercel', 'Netlify', 'Railway', 'Fly.io', 'Render',
      'CI/CD', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI', 'Travis CI', 'ArgoCD',
      'Nginx', 'Apache', 'Caddy', 'Traefik', 'HAProxy',
      'Linux', 'Ubuntu', 'Debian', 'CentOS', 'Alpine', 'Shell Scripting',
      'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Sentry', 'Loki', 'Jaeger',
      // Mobile
      'React Native', 'Flutter', 'Expo', 'Swift UI', 'UIKit', 'Jetpack Compose', 'Android SDK',
      'Ionic', 'Capacitor', 'Cordova', 'NativeScript', 'Xamarin', 'MAUI',
      // Web3 / Blockchain
      'Solidity', 'Hardhat', 'Foundry', 'Truffle', 'Ethers.js', 'Web3.js', 'Viem', 'Wagmi',
      'Smart Contracts', 'DeFi', 'NFT Development', 'IPFS', 'The Graph',
      // Testing
      'Unit Testing', 'Integration Testing', 'E2E Testing', 'TDD', 'BDD',
      'Jest', 'Vitest', 'Mocha', 'Chai', 'Jasmine', 'PyTest', 'JUnit', 'TestNG',
      'Selenium', 'Puppeteer', 'Playwright', 'Cypress', 'Appium',
      // Tools & Practices
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Linear', 'Notion',
      'Microservices', 'Monorepo', 'Event-Driven Architecture', 'CQRS', 'Domain-Driven Design',
      'System Design', 'API Design', 'OpenAPI', 'Swagger', 'Postman',
      'OAuth 2.0', 'JWT', 'SSO', 'SAML', 'Keycloak', 'Auth0',
      'WebAssembly', 'Tauri', 'Electron',
    ],
  },
  {
    label: 'Design',
    skills: [
      // Tools
      'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Framer', 'Webflow', 'Zeplin',
      'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe After Effects',
      'Adobe Premiere Pro', 'Adobe Lightroom', 'Adobe Animate', 'Adobe Dimension',
      'Canva', 'Affinity Designer', 'Affinity Photo', 'Procreate', 'Blender',
      'Cinema 4D', 'Maya', 'ZBrush', 'Substance Painter', 'KeyShot',
      // Disciplines
      'UI Design', 'UX Design', 'Product Design', 'Interaction Design', 'Visual Design',
      'Motion Design', 'Animation', '3D Modeling', 'Brand Identity', 'Logo Design',
      'Icon Design', 'Illustration', 'Typography', 'Color Theory', 'Layout Design',
      'Responsive Design', 'Design Systems', 'Component Libraries', 'Prototyping',
      'Wireframing', 'User Research', 'Usability Testing', 'Information Architecture',
      'Accessibility Design', 'Design Tokens', 'Atomic Design',
      // Print & Marketing
      'Print Design', 'Packaging Design', 'Infographic Design', 'Presentation Design',
      'Banner Design', 'Social Media Design', 'Email Design', 'Newsletter Design',
      'Brochure Design', 'Poster Design', 'Business Card Design', 'Stationery Design',
      // Video & Photography
      'Video Editing', 'Video Production', 'Motion Graphics', 'VFX', 'Color Grading',
      'Photography', 'Photo Editing', 'Photo Retouching', 'Product Photography',
      // Game Design
      'Game UI Design', 'Level Design', 'Character Design', 'Environment Design',
      'Concept Art', 'Sprite Design', 'Pixel Art',
    ],
  },
  {
    label: 'Marketing',
    skills: [
      // Digital Marketing
      'Digital Marketing', 'Growth Hacking', 'Performance Marketing', 'Demand Generation',
      'Inbound Marketing', 'Outbound Marketing', 'Account-Based Marketing', 'Product-Led Growth',
      // SEO / SEM
      'SEO', 'Technical SEO', 'On-Page SEO', 'Off-Page SEO', 'Local SEO',
      'Google Ads', 'Bing Ads', 'PPC', 'SEM', 'Programmatic Advertising',
      // Social Media
      'Social Media Marketing', 'Social Media Management', 'Community Management',
      'Instagram Marketing', 'TikTok Marketing', 'LinkedIn Marketing', 'Twitter / X Marketing',
      'YouTube Marketing', 'Facebook Ads', 'Pinterest Marketing', 'Influencer Marketing',
      // Content
      'Content Marketing', 'Content Strategy', 'Blogging', 'Video Marketing',
      'Podcast Marketing', 'Webinar Marketing', 'PR & Media Relations',
      // Email
      'Email Marketing', 'Email Automation', 'Drip Campaigns', 'Newsletter Management',
      'Mailchimp', 'Klaviyo', 'ConvertKit', 'ActiveCampaign', 'HubSpot',
      // Analytics
      'Google Analytics', 'GA4', 'Mixpanel', 'Amplitude', 'Hotjar', 'FullStory',
      'A/B Testing', 'Conversion Rate Optimization', 'Funnel Analysis', 'Cohort Analysis',
      // Advertising
      'Display Advertising', 'Native Advertising', 'Affiliate Marketing', 'Retargeting',
      'Ad Copywriting', 'Landing Page Optimization', 'Lead Generation',
      // Branding
      'Brand Strategy', 'Brand Management', 'Market Research', 'Competitive Analysis',
      'Customer Segmentation', 'Buyer Persona Development', 'Go-to-Market Strategy',
    ],
  },
  {
    label: 'Business',
    skills: [
      // Finance
      'Financial Modeling', 'Financial Analysis', 'Budgeting', 'Forecasting',
      'Valuation', 'DCF Analysis', 'Excel Modeling', 'Financial Reporting',
      'Accounting', 'Bookkeeping', 'QuickBooks', 'Xero', 'SAP FI',
      'Tax Planning', 'Payroll Management', 'Accounts Payable', 'Accounts Receivable',
      // Strategy
      'Business Strategy', 'Strategic Planning', 'Business Development', 'Market Expansion',
      'OKRs', 'KPI Management', 'Business Analysis', 'Requirements Gathering',
      'SWOT Analysis', 'Porter\'s Five Forces', 'McKinsey Frameworks',
      // Operations
      'Operations Management', 'Process Improvement', 'Six Sigma', 'Lean Management',
      'Supply Chain Management', 'Logistics', 'Inventory Management', 'ERP Systems',
      'SAP', 'Oracle ERP', 'Salesforce', 'HubSpot CRM', 'Zoho CRM',
      // Project Management
      'Project Management', 'Agile', 'Scrum', 'Kanban', 'Waterfall', 'PMP', 'PRINCE2',
      'Product Management', 'Product Roadmapping', 'Stakeholder Management',
      'Risk Management', 'Change Management', 'Program Management',
      // HR
      'Human Resources', 'Recruitment', 'Talent Acquisition', 'Onboarding',
      'Performance Management', 'Employee Engagement', 'Compensation & Benefits',
      'Learning & Development', 'HR Analytics', 'Workday', 'BambooHR',
      // Sales
      'Sales', 'B2B Sales', 'B2C Sales', 'SaaS Sales', 'Enterprise Sales',
      'Sales Strategy', 'Sales Enablement', 'CRM Management', 'Proposal Writing',
      'Contract Negotiation', 'Customer Success', 'Account Management',
      // Legal
      'Contract Management', 'Legal Research', 'Compliance', 'GDPR', 'IP Law',
      'Corporate Law', 'Startup Legal', 'Terms of Service', 'Privacy Policy',
      // Consulting
      'Management Consulting', 'IT Consulting', 'Business Consulting', 'Startup Mentoring',
      'Executive Coaching', 'Board Advisory',
    ],
  },
  {
    label: 'Data / AI',
    skills: [
      // Data Science
      'Data Science', 'Data Analysis', 'Exploratory Data Analysis', 'Statistical Analysis',
      'Predictive Modeling', 'A/B Testing', 'Hypothesis Testing', 'Regression Analysis',
      'Time Series Analysis', 'Survival Analysis', 'Bayesian Statistics',
      // Machine Learning
      'Machine Learning', 'Deep Learning', 'Neural Networks', 'Transfer Learning',
      'Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning',
      'Feature Engineering', 'Hyperparameter Tuning', 'Model Evaluation', 'Cross-Validation',
      'scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'JAX', 'XGBoost', 'LightGBM', 'CatBoost',
      // AI / LLM
      'Large Language Models', 'Prompt Engineering', 'Fine-tuning LLMs', 'RAG',
      'LangChain', 'LlamaIndex', 'OpenAI API', 'Anthropic API', 'HuggingFace',
      'Vector Databases', 'Embeddings', 'Semantic Search', 'AI Agents',
      'Computer Vision', 'Object Detection', 'Image Classification', 'OCR',
      'Natural Language Processing', 'Text Classification', 'Named Entity Recognition',
      'Sentiment Analysis', 'Speech Recognition', 'Text-to-Speech',
      // Data Engineering
      'Data Engineering', 'ETL Pipelines', 'Data Pipelines', 'Apache Spark', 'PySpark',
      'Apache Kafka', 'Apache Airflow', 'Prefect', 'dbt', 'Dagster',
      'Snowflake', 'BigQuery', 'Redshift', 'Databricks', 'Delta Lake',
      'Data Modeling', 'Data Warehousing', 'Data Lake', 'Data Mesh',
      // BI / Analytics
      'Business Intelligence', 'Tableau', 'Power BI', 'Looker', 'Metabase', 'Superset',
      'Data Visualization', 'Dashboard Design', 'Reporting',
      // Tools & Languages
      'Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Polars', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly',
      'Jupyter Notebooks', 'Google Colab', 'MLflow', 'Weights & Biases', 'DVC',
    ],
  },
  {
    label: 'Writing',
    skills: [
      // Technical Writing
      'Technical Writing', 'API Documentation', 'Developer Documentation', 'User Manuals',
      'Release Notes', 'Knowledge Base Articles', 'Standard Operating Procedures',
      'White Papers', 'Research Reports',
      // Content Writing
      'Content Writing', 'Blog Writing', 'Article Writing', 'Ghostwriting',
      'Long-form Content', 'Short-form Content', 'Evergreen Content', 'News Writing',
      'Feature Writing', 'Op-ed Writing', 'Editorial Writing',
      // Copywriting
      'Copywriting', 'UX Writing', 'Microcopy', 'Ad Copywriting', 'Landing Page Copy',
      'Email Copywriting', 'Sales Copy', 'Product Descriptions', 'Taglines & Slogans',
      'Brand Voice', 'Tone of Voice Guidelines',
      // Creative Writing
      'Creative Writing', 'Fiction Writing', 'Non-fiction Writing', 'Screenwriting',
      'Script Writing', 'Storyboarding', 'Storytelling', 'Narrative Design',
      'Game Writing', 'Dialogue Writing',
      // Business Writing
      'Business Writing', 'Proposal Writing', 'Grant Writing', 'Report Writing',
      'Case Studies', 'Press Releases', 'Investor Updates', 'LinkedIn Articles',
      'Speech Writing', 'Executive Communications',
      // SEO Writing
      'SEO Writing', 'Keyword Research', 'Content Optimization', 'Meta Descriptions',
      'Content Strategy', 'Editorial Calendar', 'Content Auditing',
      // Editing & Proofreading
      'Editing', 'Proofreading', 'Copyediting', 'Developmental Editing', 'Line Editing',
      'Academic Editing', 'Fact-checking', 'Style Guide Creation',
      // Translation
      'Translation', 'Localization', 'Transcription', 'Subtitling',
    ],
  },
];

export const ALL_SKILLS: string[] = SKILL_CATEGORIES.flatMap((c) => c.skills);

export function searchSkills(query: string): { category: string; skill: string }[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: { category: string; skill: string }[] = [];
  for (const cat of SKILL_CATEGORIES) {
    for (const skill of cat.skills) {
      if (skill.toLowerCase().includes(q)) {
        results.push({ category: cat.label, skill });
      }
    }
  }
  return results;
}
