const fs = require('fs');
const path = require('path');

const dir = '/Users/user/Documents/lomba';

const navBlockRegex = /<nav id="navbar"[^>]*>[\s\S]*?<\/nav>/i;

const menuMapping = {
  'index': { item: '{index_active}', parent: null },
  'about': { item: '{about_active}', parent: null },
  'competition': { item: '{competition_active}', parent: '{programs_active}' },
  'timeline': { item: '{timeline_active}', parent: '{programs_active}' },
  'innovation-roadmap': { item: '{innovation-roadmap_active}', parent: '{programs_active}' },
  'daily-challenge': { item: '{daily-challenge_active}', parent: '{programs_active}' },
  
  'ai-evaluator': { item: '{ai-evaluator_active}', parent: '{tools_active}' },
  'skill-gap': { item: '{skill-gap_active}', parent: '{tools_active}' },
  'innovation-canvas': { item: '{innovation-canvas_active}', parent: '{tools_active}' },
  'innovation-impact': { item: '{innovation-impact_active}', parent: '{tools_active}' },
  'pitch-deck-generator': { item: '{pitch-deck-generator_active}', parent: '{tools_active}' },
  
  'resources': { item: '{resources_active2}', parent: '{resources_active}' },
  'recommended-resources': { item: '{recommended-resources_active}', parent: '{resources_active}' },
  'ai-mentor': { item: '{ai-mentor_active}', parent: '{resources_active}' },
  
  'dashboard': { item: '{dashboard_active2}', parent: '{dashboard_active}' },
  'innovation-readiness': { item: '{innovation-readiness_active}', parent: '{dashboard_active}' },
  'achievements': { item: '{achievements_active}', parent: '{dashboard_active}' },
  'global-innovation-map': { item: '{global-innovation-map_active}', parent: '{dashboard_active}' }
};

fs.readdir(dir, (err, files) => {
  if (err) throw err;

  const htmlFiles = files.filter(f => f.endsWith('.html'));
  
  htmlFiles.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!navBlockRegex.test(content)) {
      console.log(`Could not match nav block in ${file}`);
      return;
    }
    
    const basename = file.replace('.html', '');
    
    let newNavInner = `
  <nav id="navbar" class="navbar navbar-expand-lg sticky-top glass py-2" role="navigation" aria-label="Primary navigation">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center" href="index.html">
        <img src="assets/logo.svg" alt="NovaMind Logo" class="logo me-2" width="32" height="32">
        <span class="brand-text">NovaMind</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link {index_active}" href="index.html">Home</a></li>
          <li class="nav-item"><a class="nav-link {about_active}" href="about.html">About</a></li>
          
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle {programs_active}" href="#" id="programsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Programs <i class="fa-solid fa-chevron-down ms-1" style="font-size: 0.75em;"></i>
            </a>
            <ul class="dropdown-menu dropdown-menu-end glass border-0 shadow-sm" aria-labelledby="programsDropdown">
              <li><a class="dropdown-item {competition_active}" href="competition.html">Competition</a></li>
              <li><a class="dropdown-item {timeline_active}" href="timeline.html">Timeline</a></li>
              <li><a class="dropdown-item {innovation-roadmap_active}" href="innovation-roadmap.html">Innovation Roadmap</a></li>
              <li><a class="dropdown-item {daily-challenge_active}" href="daily-challenge.html">Daily Challenge</a></li>
            </ul>
          </li>

          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle {tools_active}" href="#" id="toolsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Tools <i class="fa-solid fa-chevron-down ms-1" style="font-size: 0.75em;"></i>
            </a>
            <ul class="dropdown-menu dropdown-menu-end glass border-0 shadow-sm" aria-labelledby="toolsDropdown">
              <li><a class="dropdown-item {ai-evaluator_active}" href="ai-evaluator.html">AI Project Evaluator</a></li>
              <li><a class="dropdown-item {skill-gap_active}" href="skill-gap.html">Skill Gap Analysis</a></li>
              <li><a class="dropdown-item {innovation-canvas_active}" href="innovation-canvas.html">Innovation Canvas</a></li>
              <li><a class="dropdown-item {innovation-impact_active}" href="innovation-impact.html">Innovation Impact Score</a></li>
              <li><a class="dropdown-item {pitch-deck-generator_active}" href="pitch-deck-generator.html">Pitch Deck Generator</a></li>
            </ul>
          </li>

          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle {resources_active}" href="#" id="resourcesDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Resources <i class="fa-solid fa-chevron-down ms-1" style="font-size: 0.75em;"></i>
            </a>
            <ul class="dropdown-menu dropdown-menu-end glass border-0 shadow-sm" aria-labelledby="resourcesDropdown">
              <li><a class="dropdown-item {resources_active2}" href="resources.html">Learning Resources</a></li>
              <li><a class="dropdown-item {recommended-resources_active}" href="recommended-resources.html">Recommended Resources</a></li>
              <li><a class="dropdown-item {ai-mentor_active}" href="ai-mentor.html">AI Mentor</a></li>
            </ul>
          </li>

          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle {dashboard_active}" href="#" id="dashboardDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Dashboard <i class="fa-solid fa-chevron-down ms-1" style="font-size: 0.75em;"></i>
            </a>
            <ul class="dropdown-menu dropdown-menu-end glass border-0 shadow-sm" aria-labelledby="dashboardDropdown">
              <li><a class="dropdown-item {dashboard_active2}" href="dashboard.html">Dashboard Overview</a></li>
              <li><a class="dropdown-item {innovation-readiness_active}" href="innovation-readiness.html">Innovation Readiness</a></li>
              <li><a class="dropdown-item {achievements_active}" href="achievements.html">Achievements</a></li>
              <li><a class="dropdown-item {global-innovation-map_active}" href="global-innovation-map.html">Global Innovation Map</a></li>
            </ul>
          </li>
        </ul>
        <a href="register.html" class="premium-btn ms-3 text-decoration-none">Register</a>
        <button class="btn btn-outline-dark ms-2" id="dark-mode-toggle" aria-label="Toggle dark mode"><i class="fa-solid fa-moon"></i></button>
      </div>
    </div>
  </nav>`;

    // Replace the placeholders
    const mapping = menuMapping[basename];
    if (mapping) {
      newNavInner = newNavInner.replace(mapping.item, 'active');
      if (mapping.parent) {
        newNavInner = newNavInner.replace(mapping.parent, 'active');
      }
    }
    
    // Clean up remaining placeholders
    newNavInner = newNavInner.replace(/\{[a-z0-9\-_]+\}/g, '');

    content = content.replace(navBlockRegex, newNavInner.trim());
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated nav in ${file}`);
  });
});
