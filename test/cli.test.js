'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLI = path.resolve(__dirname, '..', 'bin', 'tezgah.js');
const SKILLS_SRC = path.resolve(__dirname, '..', 'skills');

let tmpDir;
let passed = 0;
let failed = 0;

function run(args, cwd) {
  return execSync(`node ${CLI} ${args} --no-color`, {
    cwd: cwd || tmpDir,
    encoding: 'utf-8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m\u2713\x1b[0m ${message}`);
    passed++;
  } else {
    console.log(`  \x1b[31m\u2717\x1b[0m ${message}`);
    failed++;
  }
}

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tezgah-test-'));
}

function cleanup() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// --- Tests ---

function testVersion() {
  const output = run('--version');
  const pkg = require('../package.json');
  assert(output.trim() === pkg.version, `--version ciktisi: ${pkg.version}`);
}

function testHelp() {
  const output = run('help');
  assert(output.includes('tezgah init'), 'help ciktisi init komutunu iceriyor');
  assert(output.includes('tezgah add'), 'help ciktisi add komutunu iceriyor');
  assert(output.includes('tezgah remove'), 'help ciktisi remove komutunu iceriyor');
  assert(output.includes('tezgah update'), 'help ciktisi update komutunu iceriyor');
  assert(output.includes('tezgah doctor'), 'help ciktisi doctor komutunu iceriyor');
}

function testList() {
  const output = run('list');
  assert(output.includes('saas-launcher'), 'list orkestratoru gosteriyor');
  assert(output.includes('saas-auth'), 'list saas-auth gosteriyor');
  assert(output.includes('saas-database'), 'list saas-database gosteriyor');

  const skillDirs = fs.readdirSync(SKILLS_SRC).filter((d) => {
    return fs.statSync(path.join(SKILLS_SRC, d)).isDirectory() && !d.startsWith('.');
  });
  assert(output.includes(`${skillDirs.length} skill`), `list ${skillDirs.length} skill sayisini gosteriyor`);
}

function testInit() {
  const output = run('init');
  assert(output.includes('skill basariyla kuruldu'), 'init basarili mesaji veriyor');

  const installed = fs.existsSync(path.join(tmpDir, 'skills', 'saas-launcher', 'SKILL.md'));
  assert(installed, 'init saas-launcher/SKILL.md olusturuyor');

  const installed2 = fs.existsSync(path.join(tmpDir, 'skills', 'saas-auth', 'SKILL.md'));
  assert(installed2, 'init saas-auth/SKILL.md olusturuyor');

  const installed3 = fs.existsSync(path.join(tmpDir, 'skills', 'saas-database', 'SKILL.md'));
  assert(installed3, 'init saas-database/SKILL.md olusturuyor');
}

function testInitNoOverwrite() {
  run('init');
  const output = run('init');
  assert(output.includes('zaten mevcut'), 'init tekrar calistiginda ustune yazmaz');
}

function testInitForce() {
  run('init');
  const output = run('init --force');
  assert(output.includes('skill basariyla kuruldu'), 'init --force tekrar kurar');
}

function testInitCustomDir() {
  const output = run('init --dir custom-skills');
  assert(output.includes('skill basariyla kuruldu'), 'init --dir basarili');

  const installed = fs.existsSync(path.join(tmpDir, 'custom-skills', 'saas-launcher', 'SKILL.md'));
  assert(installed, 'init --dir ozel klasore kuruyor');
}

function testAdd() {
  const output = run('add saas-auth');
  assert(output.includes('saas-auth/SKILL.md'), 'add tek skill kuruyor');

  const installed = fs.existsSync(path.join(tmpDir, 'skills', 'saas-auth', 'SKILL.md'));
  assert(installed, 'add dosyayi olusturuyor');
}

function testAddInvalidSkill() {
  const output = run('add saas-nonexistent');
  assert(output.includes('skill bulunamadi'), 'add gecersiz skill icin hata veriyor');
}

function testAddSuggestion() {
  const output = run('add saas-aut');
  assert(output.includes('saas-auth'), 'add yazim hatasinda oneri sunuyor');
}

function testRemove() {
  run('init');
  const output = run('remove saas-auth');
  assert(output.includes('kaldirildi'), 'remove basarili mesaji veriyor');

  const exists = fs.existsSync(path.join(tmpDir, 'skills', 'saas-auth', 'SKILL.md'));
  assert(!exists, 'remove dosyayi siliyor');
}

function testRemoveNotInstalled() {
  const output = run('remove saas-auth');
  assert(output.includes('kurulu degil'), 'remove kurulu olmayan skill icin uyariyor');
}

function testUpdate() {
  run('init');
  // Modify a file to simulate outdated
  const dest = path.join(tmpDir, 'skills', 'saas-auth', 'SKILL.md');
  fs.writeFileSync(dest, '---\nname: saas-auth\n---\nOld content');

  const output = run('update');
  assert(output.includes('guncellendi'), 'update degisen skill\'i guncelliyor');
}

function testUpdateNoChanges() {
  run('init');
  const output = run('update');
  assert(output.includes('guncel'), 'update degisiklik yoksa bildiriyor');
}

function testDoctor() {
  run('init');
  const output = run('doctor');
  assert(output.includes('Node.js'), 'doctor Node.js versiyonunu kontrol ediyor');
  assert(output.includes('skill kurulu'), 'doctor kurulu skill sayisini gosteriyor');
  assert(output.includes('yolunda'), 'doctor sorun yoksa onayliyor');
}

function testDoctorMissingSkills() {
  const output = run('doctor');
  assert(output.includes('bulunamadi') || output.includes('eksik'), 'doctor eksik skill\'leri bildiriyor');
}

function testNoColor() {
  const output = run('list');
  assert(!output.includes('\x1b['), 'NO_COLOR ortam degiskeninde renk kodu yok');
}

// --- Runner ---

console.log();
console.log('\x1b[1mTezgah CLI Testleri\x1b[0m');
console.log();

const tests = [
  ['version', testVersion],
  ['help', testHelp],
  ['list', testList],
  ['init', testInit],
  ['init (no overwrite)', testInitNoOverwrite],
  ['init --force', testInitForce],
  ['init --dir', testInitCustomDir],
  ['add', testAdd],
  ['add (invalid)', testAddInvalidSkill],
  ['add (suggestion)', testAddSuggestion],
  ['remove', testRemove],
  ['remove (not installed)', testRemoveNotInstalled],
  ['update', testUpdate],
  ['update (no changes)', testUpdateNoChanges],
  ['doctor', testDoctor],
  ['doctor (missing)', testDoctorMissingSkills],
  ['no-color', testNoColor],
];

for (const [name, fn] of tests) {
  setup();
  try {
    fn();
  } catch (err) {
    console.log(`  \x1b[31m\u2717\x1b[0m ${name}: ${err.message}`);
    failed++;
  }
  cleanup();
}

console.log();
console.log(`  ${passed} gecti, ${failed} basarisiz`);
console.log();

if (failed > 0) {
  process.exit(1);
}
