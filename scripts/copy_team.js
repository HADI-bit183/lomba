const fs = require('fs');
const path = require('path');

const srcDir = '/Users/user/.gemini/antigravity-ide/brain/46050ece-d18b-42f6-8af1-3038e7ae7f9e/';
const destDir = '/Users/user/Downloads/lomba/assets/images/';

fs.copyFileSync(path.join(srcDir, 'team_1_developer_1782970133229.png'), path.join(destDir, 'team_1_developer.png'));
fs.copyFileSync(path.join(srcDir, 'team_2_designer_1782970200395.png'), path.join(destDir, 'team_2_designer.png'));
fs.copyFileSync(path.join(srcDir, 'team_3_researcher_1782970295832.png'), path.join(destDir, 'team_3_researcher.png'));
fs.copyFileSync(path.join(srcDir, 'team_4_backend_1782970399008.png'), path.join(destDir, 'team_4_backend.png'));

console.log('Copied team images!');
