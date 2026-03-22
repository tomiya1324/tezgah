'use strict';

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const SKILLS_SRC = path.resolve(__dirname, '..', 'skills');

// --- Color support detection ---

const noColor = 'NO_COLOR' in process.env || process.argv.includes('--no-color');
const forceColor = process.argv.includes('--color');
const useColor = forceColor || (!noColor && process.stdout.isTTY);

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function c(color, text) {
  if (!useColor) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

// --- Skill utilities ---

function getSkills() {
  return fs
    .readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => {
      const skillPath = path.join(SKILLS_SRC, d.name, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return null;
      const content = fs.readFileSync(skillPath, 'utf-8');
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
      let description = '';
      if (frontmatter) {
        const descMatch = frontmatter[1].match(/description:\s*>\s*\n([\s\S]*?)(?=\n\w|\n---|$)/);
        if (descMatch) {
          description = descMatch[1].replace(/\s+/g, ' ').trim();
        } else {
          const inlineMatch = frontmatter[1].match(/description:\s*["']?(.+?)["']?\s*$/m);
          if (inlineMatch) {
            description = inlineMatch[1].trim();
          }
        }
      }
      return { name: d.name, description };
    })
    .filter(Boolean);
}

function getSkillNames() {
  return getSkills().map((s) => s.name);
}

function suggestSkill(input) {
  const names = getSkillNames();
  const exact = names.find((n) => n === input);
  if (exact) return null;

  // Prefix match
  const prefixMatches = names.filter((n) => n.startsWith(input));
  if (prefixMatches.length === 1) return prefixMatches[0];

  // Contains match
  const containsMatches = names.filter((n) => n.includes(input));
  if (containsMatches.length === 1) return containsMatches[0];

  // Levenshtein distance for typos
  let best = null;
  let bestDist = Infinity;
  for (const name of names) {
    const dist = levenshtein(input, name);
    if (dist < bestDist && dist <= Math.max(3, Math.floor(name.length / 3))) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// --- Argument parsing ---

function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      flags.dir = args[++i];
    } else if (args[i] === '--force' || args[i] === '-f') {
      flags.force = true;
    } else if (args[i] === '--no-color' || args[i] === '--color') {
      // handled globally
    } else if (args[i].startsWith('-')) {
      flags[args[i].replace(/^-+/, '')] = true;
    } else {
      positional.push(args[i]);
    }
  }
  return { flags, positional };
}

// --- File operations ---

function copySkill(skillName, targetDir, force) {
  const src = path.join(SKILLS_SRC, skillName, 'SKILL.md');
  if (!fs.existsSync(src)) {
    const suggestion = suggestSkill(skillName);
    let msg = `${skillName} — skill bulunamadi`;
    if (suggestion) {
      msg += `. ${c('cyan', suggestion)} mu demek istediniz?`;
    }
    console.log(`  ${c('red', '\u2717')} ${msg}`);
    return false;
  }

  const destDir = path.join(targetDir, skillName);
  const dest = path.join(destDir, 'SKILL.md');

  if (fs.existsSync(dest) && !force) {
    console.log(`  ${c('yellow', '\u2022')} ${skillName} — zaten mevcut (--force ile degistir)`);
    return false;
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ${c('green', '\u2713')} ${skillName}/SKILL.md`);
  return true;
}

function removeSkill(skillName, targetDir) {
  const destDir = path.join(targetDir, skillName);
  const dest = path.join(destDir, 'SKILL.md');

  if (!fs.existsSync(dest)) {
    console.log(`  ${c('yellow', '\u2022')} ${skillName} — kurulu degil`);
    return false;
  }

  fs.unlinkSync(dest);
  // Remove directory if empty
  try {
    const remaining = fs.readdirSync(destDir);
    if (remaining.length === 0) {
      fs.rmdirSync(destDir);
    }
  } catch (_e) {
    // ignore
  }
  console.log(`  ${c('green', '\u2713')} ${skillName} kaldirildi`);
  return true;
}

// --- Commands ---

function cmdInit(args) {
  const { flags } = parseArgs(args);
  const targetDir = path.resolve(process.cwd(), flags.dir || 'skills');

  console.log();
  console.log(`  ${c('bold', 'Tezgah')} ${c('dim', `v${pkg.version}`)}`);
  console.log(`  ${c('dim', 'SaaS skill\'leri kuruluyor...')}`);
  console.log();

  const skills = getSkills();
  let installed = 0;

  for (const skill of skills) {
    if (copySkill(skill.name, targetDir, flags.force)) {
      installed++;
    }
  }

  console.log();
  if (installed > 0) {
    console.log(`  ${c('green', `${installed} skill basariyla kuruldu.`)}`);
  } else {
    console.log(`  ${c('yellow', 'Yeni skill kurulmadi. Mevcut skill\'leri guncellemek icin --force kullan.')}`);
  }
  console.log();
  console.log(`  ${c('dim', 'Baslamak icin: Claude Code\'da')} ${c('cyan', '/saas-launcher')} ${c('dim', 'komutunu calistir.')}`);
  console.log();
}

function cmdAdd(args) {
  const { flags, positional } = parseArgs(args);
  const skillName = positional[0];

  if (!skillName) {
    console.log();
    console.log(`  ${c('red', 'Hata:')} Skill adi belirtilmedi.`);
    console.log(`  ${c('dim', 'Kullanim:')} tezgah add <skill-adi>`);
    console.log(`  ${c('dim', 'Ornek:')}   tezgah add saas-auth`);
    console.log();
    console.log(`  ${c('dim', 'Mevcut skill\'leri gormek icin:')} tezgah list`);
    console.log();
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), flags.dir || 'skills');

  console.log();
  console.log(`  ${c('bold', 'Tezgah')} ${c('dim', `v${pkg.version}`)}`);
  console.log();

  const success = copySkill(skillName, targetDir, flags.force);

  console.log();
  if (success) {
    console.log(`  ${c('dim', 'Kullanmak icin: Claude Code\'da')} ${c('cyan', `/${skillName}`)} ${c('dim', 'komutunu calistir.')}`);
    console.log();
  }
}

function cmdRemove(args) {
  const { flags, positional } = parseArgs(args);
  const skillName = positional[0];

  if (!skillName) {
    console.log();
    console.log(`  ${c('red', 'Hata:')} Skill adi belirtilmedi.`);
    console.log(`  ${c('dim', 'Kullanim:')} tezgah remove <skill-adi>`);
    console.log();
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), flags.dir || 'skills');

  console.log();
  console.log(`  ${c('bold', 'Tezgah')} ${c('dim', `v${pkg.version}`)}`);
  console.log();

  removeSkill(skillName, targetDir);
  console.log();
}

function cmdUpdate(args) {
  const { flags } = parseArgs(args);
  const targetDir = path.resolve(process.cwd(), flags.dir || 'skills');

  console.log();
  console.log(`  ${c('bold', 'Tezgah')} ${c('dim', `v${pkg.version}`)}`);
  console.log(`  ${c('dim', 'Skill\'ler guncelleniyor...')}`);
  console.log();

  const skills = getSkills();
  let updated = 0;
  let skipped = 0;

  for (const skill of skills) {
    const src = path.join(SKILLS_SRC, skill.name, 'SKILL.md');
    const dest = path.join(targetDir, skill.name, 'SKILL.md');

    if (!fs.existsSync(dest)) {
      console.log(`  ${c('dim', '\u2022')} ${skill.name} — kurulu degil, atlaniyor`);
      skipped++;
      continue;
    }

    const srcContent = fs.readFileSync(src, 'utf-8');
    const destContent = fs.readFileSync(dest, 'utf-8');

    if (srcContent === destContent) {
      console.log(`  ${c('dim', '\u2022')} ${skill.name} — degisiklik yok`);
      skipped++;
    } else {
      fs.copyFileSync(src, dest);
      console.log(`  ${c('green', '\u2713')} ${skill.name} guncellendi`);
      updated++;
    }
  }

  console.log();
  if (updated > 0) {
    console.log(`  ${c('green', `${updated} skill guncellendi.`)} ${c('dim', `${skipped} degisiklik yok.`)}`);
  } else {
    console.log(`  ${c('dim', 'Tum skill\'ler guncel.')}`);
  }
  console.log();
}

function cmdDoctor(args) {
  const { flags } = parseArgs(args);
  const targetDir = path.resolve(process.cwd(), flags.dir || 'skills');

  console.log();
  console.log(`  ${c('bold', 'Tezgah')} ${c('dim', `v${pkg.version}`)} ${c('dim', '— Sistem Kontrolu')}`);
  console.log();

  let issues = 0;

  // Node.js version
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split('.')[0], 10);
  if (major >= 18) {
    console.log(`  ${c('green', '\u2713')} Node.js v${nodeVersion} (>= 18.0.0)`);
  } else {
    console.log(`  ${c('red', '\u2717')} Node.js v${nodeVersion} — v18+ gerekli`);
    issues++;
  }

  // Skills directory
  if (fs.existsSync(targetDir)) {
    console.log(`  ${c('green', '\u2713')} ${path.relative(process.cwd(), targetDir) || 'skills'}/ klasoru mevcut`);
  } else {
    console.log(`  ${c('red', '\u2717')} ${path.relative(process.cwd(), targetDir) || 'skills'}/ klasoru bulunamadi`);
    issues++;
  }

  // Installed skills
  const allSkills = getSkills();
  let installedCount = 0;
  const missing = [];

  for (const skill of allSkills) {
    const dest = path.join(targetDir, skill.name, 'SKILL.md');
    if (fs.existsSync(dest)) {
      installedCount++;
    } else {
      missing.push(skill.name);
    }
  }

  if (installedCount === allSkills.length) {
    console.log(`  ${c('green', '\u2713')} ${installedCount}/${allSkills.length} skill kurulu`);
  } else {
    console.log(`  ${c('yellow', '\u2022')} ${installedCount}/${allSkills.length} skill kurulu`);
    for (const m of missing) {
      console.log(`    ${c('dim', '\u2514')} ${c('yellow', m)} eksik`);
    }
  }

  // Outdated check
  let outdated = 0;
  for (const skill of allSkills) {
    const src = path.join(SKILLS_SRC, skill.name, 'SKILL.md');
    const dest = path.join(targetDir, skill.name, 'SKILL.md');
    if (fs.existsSync(dest)) {
      const srcContent = fs.readFileSync(src, 'utf-8');
      const destContent = fs.readFileSync(dest, 'utf-8');
      if (srcContent !== destContent) outdated++;
    }
  }

  if (outdated > 0) {
    console.log(`  ${c('yellow', '\u2022')} ${outdated} skill guncel degil — ${c('cyan', 'tezgah update')} ile guncelle`);
  } else if (installedCount > 0) {
    console.log(`  ${c('green', '\u2713')} Tum kurulu skill'ler guncel`);
  }

  // Frontmatter validation
  let invalidFrontmatter = 0;
  for (const skill of allSkills) {
    const dest = path.join(targetDir, skill.name, 'SKILL.md');
    if (fs.existsSync(dest)) {
      const content = fs.readFileSync(dest, 'utf-8');
      if (!content.startsWith('---')) {
        console.log(`  ${c('red', '\u2717')} ${skill.name}/SKILL.md — frontmatter eksik`);
        invalidFrontmatter++;
        issues++;
      }
    }
  }
  if (invalidFrontmatter === 0 && installedCount > 0) {
    console.log(`  ${c('green', '\u2713')} Frontmatter gecerli`);
  }

  console.log();
  if (issues === 0) {
    console.log(`  ${c('green', 'Her sey yolunda!')}`);
  } else {
    console.log(`  ${c('yellow', `${issues} sorun bulundu.`)}`);
  }
  console.log();
}

function cmdList() {
  const skills = getSkills();

  console.log();
  console.log(`  ${c('bold', 'Tezgah')} ${c('dim', `v${pkg.version}`)} ${c('dim', `— ${skills.length} skill`)}`);
  console.log();

  const orchestrator = skills.find((s) => s.name === 'saas-launcher');
  const experts = skills.filter((s) => s.name !== 'saas-launcher');

  if (orchestrator) {
    console.log(`  ${c('cyan', '\u25B6')} ${c('bold', orchestrator.name)} ${c('dim', '(orkestrator)')}`);
    if (orchestrator.description) {
      const short = orchestrator.description.substring(0, 80);
      console.log(`    ${c('dim', short + (orchestrator.description.length > 80 ? '...' : ''))}`);
    }
    console.log();
  }

  for (const skill of experts) {
    console.log(`  ${c('green', '\u25CB')} ${c('bold', skill.name)}`);
    if (skill.description) {
      const short = skill.description.substring(0, 80);
      console.log(`    ${c('dim', short + (skill.description.length > 80 ? '...' : ''))}`);
    }
  }

  console.log();
  console.log(`  ${c('dim', 'Tum skill\'leri kurmak icin:')} tezgah init`);
  console.log(`  ${c('dim', 'Tek bir skill kurmak icin:')} tezgah add <skill-adi>`);
  console.log();
}

function cmdHelp() {
  console.log();
  console.log(`  ${c('bold', 'Tezgah')} ${c('dim', `v${pkg.version}`)}`);
  console.log(`  ${c('dim', 'Claude Code icin SaaS baslama kiti')}`);
  console.log();
  console.log(`  ${c('bold', 'Komutlar:')}`);
  console.log(`    ${c('cyan', 'tezgah init')}    ${c('dim', '[--dir <klasor>] [--force]')}   Tum skill'leri projeye kur`);
  console.log(`    ${c('cyan', 'tezgah add')}     ${c('dim', '<skill> [--dir <klasor>]')}     Tek bir skill ekle`);
  console.log(`    ${c('cyan', 'tezgah remove')}  ${c('dim', '<skill> [--dir <klasor>]')}     Bir skill'i kaldir`);
  console.log(`    ${c('cyan', 'tezgah update')}  ${c('dim', '[--dir <klasor>]')}             Kurulu skill'leri guncelle`);
  console.log(`    ${c('cyan', 'tezgah doctor')}  ${c('dim', '[--dir <klasor>]')}             Kurulumu kontrol et`);
  console.log(`    ${c('cyan', 'tezgah list')}                                Mevcut skill'leri listele`);
  console.log(`    ${c('cyan', 'tezgah help')}                                Bu yardim mesajini goster`);
  console.log();
  console.log(`  ${c('bold', 'Bayraklar:')}`);
  console.log(`    ${c('dim', '--force, -f')}    Mevcut dosyalarin ustune yaz`);
  console.log(`    ${c('dim', '--dir <klasor>')} Hedef klasoru belirle (varsayilan: skills)`);
  console.log(`    ${c('dim', '--no-color')}     Renksiz cikti`);
  console.log();
  console.log(`  ${c('bold', 'Ornekler:')}`);
  console.log(`    ${c('dim', '$')} npx tezgah init`);
  console.log(`    ${c('dim', '$')} npx tezgah add saas-auth`);
  console.log(`    ${c('dim', '$')} npx tezgah remove saas-storage`);
  console.log(`    ${c('dim', '$')} npx tezgah update`);
  console.log(`    ${c('dim', '$')} npx tezgah doctor`);
  console.log(`    ${c('dim', '$')} npx tezgah init --dir .claude/skills --force`);
  console.log();
  console.log(`  ${c('dim', 'Dokumantasyon: https://github.com/komunite/tezgah')}`);
  console.log();
}

function cmdVersion() {
  console.log(pkg.version);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      return cmdInit(args.slice(1));
    case 'add':
      return cmdAdd(args.slice(1));
    case 'remove':
      return cmdRemove(args.slice(1));
    case 'update':
      return cmdUpdate(args.slice(1));
    case 'doctor':
      return cmdDoctor(args.slice(1));
    case 'list':
      return cmdList();
    case 'help':
    case '--help':
    case '-h':
      return cmdHelp();
    case 'version':
    case '--version':
    case '-v':
      return cmdVersion();
    default:
      return cmdHelp();
  }
}

main();
