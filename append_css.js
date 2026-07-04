const fs = require('fs');

const css = `
/* --- Innovation Canvas --- */
.canvas-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 15px;
}
.canvas-box {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 15px;
}
.box-title { font-size: 0.85rem; font-weight: bold; color: var(--primary); margin-bottom: 10px; text-transform: uppercase; }
.box-content { font-size: 0.9rem; color: var(--text-primary); white-space: pre-wrap; }

/* Grid layout matching typical lean canvas */
.c-problem { grid-column: span 3; grid-row: span 2; }
.c-solution { grid-column: span 3; grid-row: span 1; }
.c-uvp { grid-column: span 3; grid-row: span 2; }
.c-tech { grid-column: span 3; grid-row: span 1; }
.c-users { grid-column: span 3; grid-row: span 2; }

.c-partners { grid-column: span 4; }
.c-competitor { grid-column: span 4; }
.c-revenue { grid-column: span 6; }
.c-cost { grid-column: span 6; }

@media (max-width: 991px) {
  .c-problem, .c-solution, .c-uvp, .c-tech, .c-users, .c-partners, .c-competitor, .c-revenue, .c-cost {
    grid-column: span 12;
  }
}
`;

fs.appendFileSync('/Users/user/Documents/lomba/css/style.css', css);
console.log('Appended canvas styles to style.css');
