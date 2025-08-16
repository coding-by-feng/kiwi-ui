/* eslint-disable no-console */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const globby = require('globby');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const MagicString = require('magic-string');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const apiDir = path.join(srcDir, 'api');
const writeMode = process.argv.includes('--write');

const JS_TS_EXTS = ['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx'];
const CODE_GLOBS = [
  'src/**/*.{js,ts,jsx,tsx,vue}',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/.nuxt/**',
  '!**/.output/**',
  '!**/.next/**',
  '!**/build/**',
];

function parseCode(code, file) {
  try {
    return parser.parse(code, {
      sourceType: 'module',
      sourceFilename: file,
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'objectRestSpread',
        'optionalChaining',
        'nullishCoalescingOperator',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'topLevelAwait',
      ],
    });
  } catch (e) {
    console.warn(`[skip:parse-error] ${file}: ${e.message}`);
    return null;
  }
}

function extractScriptsFromVue(source) {
  // simple extraction of all <script> and <script setup> blocks
  const scripts = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(source))) scripts.push(m[1]);
  return scripts.join('\n');
}

async function readFile(file) {
  try {
    return await fsp.readFile(file, 'utf8');
  } catch {
    return null;
  }
}

function isInsideApi(p) {
  const abs = path.resolve(p);
  return abs.startsWith(apiDir + path.sep) || abs === apiDir;
}

function resolveAliasToAbs(source) {
  if (source.startsWith('@/')) return path.join(srcDir, source.slice(2));
  if (source.startsWith('/src/')) return path.join(projectRoot, source.replace(/^\/+/, ''));
  if (source.startsWith('src/')) return path.join(projectRoot, source);
  return null;
}

function resolveWithExtensions(absPath) {
  // Try direct file
  if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) return absPath;
  // Try extensions
  for (const ext of JS_TS_EXTS) {
    if (fs.existsSync(absPath + ext)) return absPath + ext;
  }
  // Try index files
  if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
    for (const ext of JS_TS_EXTS) {
      const idx = path.join(absPath, 'index' + ext);
      if (fs.existsSync(idx)) return idx;
    }
  }
  return null;
}

function resolveImportToFile(importSource, importerFile) {
  let base = null;
  if (importSource.startsWith('.')) {
    base = path.resolve(path.dirname(importerFile), importSource);
  } else {
    base = resolveAliasToAbs(importSource);
    if (!base) return null;
  }
  const resolved = resolveWithExtensions(base);
  if (!resolved) return null;
  if (isInsideApi(resolved)) return path.resolve(resolved);
  return null;
}

async function collectApiDefaultObjectMethods() {
  const apiFiles = await globby(['src/api/**/*.{js,ts}', '!**/node_modules/**']);
  const map = new Map(); // file -> { code, obj, props: [{name,start,end}], hasDefaultObject }
  for (const file of apiFiles) {
    const abs = path.join(projectRoot, file);
    const code = await readFile(abs);
    if (!code) continue;
    const ast = parseCode(code, abs);
    if (!ast) continue;

    let defaultObject = null;
    traverse(ast, {
      ExportDefaultDeclaration(p) {
        const decl = p.node.declaration;
        if (decl && decl.type === 'ObjectExpression') {
          defaultObject = decl;
        }
      },
    });
    if (!defaultObject) {
      map.set(abs, { code, hasDefaultObject: false, props: [], objectNode: null });
      continue;
    }

    const props = [];
    for (const prop of defaultObject.properties) {
      // ObjectMethod or ObjectProperty with function value
      if (prop.type === 'ObjectMethod') {
        const key = prop.key;
        const name = key.type === 'Identifier' ? key.name : key.type === 'StringLiteral' ? key.value : null;
        if (name) props.push({ name, start: prop.start, end: prop.end });
      } else if (prop.type === 'ObjectProperty') {
        const isFn =
          prop.value &&
          (prop.value.type === 'FunctionExpression' || prop.value.type === 'ArrowFunctionExpression');
        if (!isFn) continue;
        const key = prop.key;
        const name = key.type === 'Identifier' ? key.name : key.type === 'StringLiteral' ? key.value : null;
        if (name) props.push({ name, start: prop.start, end: prop.end });
      }
    }

    map.set(abs, {
      code,
      hasDefaultObject: true,
      objectNode: defaultObject,
      props,
    });
  }
  return map;
}

async function collectUsedApiMethods() {
  const files = await globby(CODE_GLOBS, { cwd: projectRoot, absolute: true });
  const used = new Map(); // apiFile -> Set(methodName)

  for (const file of files) {
    const raw = await readFile(file);
    if (!raw) continue;

    const isVue = file.endsWith('.vue');
    const code = isVue ? extractScriptsFromVue(raw) : raw;
    if (!code.trim()) continue;

    const ast = parseCode(code, file);
    if (!ast) continue;

    // localName -> resolvedApiFile
    const defaultOrNsImports = new Map();

    traverse(ast, {
      ImportDeclaration(p) {
        const src = p.node.source && p.node.source.value;
        if (!src) return;
        const resolved = resolveImportToFile(src, file);
        if (!resolved) return;

        for (const s of p.node.specifiers) {
          if (s.type === 'ImportDefaultSpecifier' || s.type === 'ImportNamespaceSpecifier') {
            defaultOrNsImports.set(s.local.name, resolved);
          }
          // We ignore named specifiers on purpose; the script focuses on methods of default-exported objects.
        }
      },
      MemberExpression(p) {
        const obj = p.node.object;
        const prop = p.node.property;
        const isComputed = p.node.computed === true;
        if (obj && obj.type === 'Identifier' && defaultOrNsImports.has(obj.name) && !isComputed) {
          if (prop.type === 'Identifier') {
            const apiFile = defaultOrNsImports.get(obj.name);
            if (!used.has(apiFile)) used.set(apiFile, new Set());
            used.get(apiFile).add(prop.name);
          }
        }
      },
      OptionalMemberExpression(p) {
        const obj = p.node.object;
        const prop = p.node.property;
        const isComputed = p.node.computed === true;
        if (obj && obj.type === 'Identifier' && defaultOrNsImports.has(obj.name) && !isComputed) {
          if (prop.type === 'Identifier') {
            const apiFile = defaultOrNsImports.get(obj.name);
            if (!used.has(apiFile)) used.set(apiFile, new Set());
            used.get(apiFile).add(prop.name);
          }
        }
      },
    });
  }

  return used;
}

function rebuildObjectLiteral(code, objectNode, keepProps) {
  const s = new MagicString(code);
  const open = objectNode.start + 1; // after '{'
  const close = objectNode.end - 1;  // before '}'

  if (keepProps.length === 0) {
    // empty object
    s.overwrite(open, close, '');
    return s.toString();
  }

  // Determine indentation from first kept prop
  const first = keepProps[0];
  const beforeFirst = code.lastIndexOf('\n', first.start);
  const firstLineStart = beforeFirst === -1 ? 0 : beforeFirst + 1;
  const indentMatch = code.slice(firstLineStart, first.start).match(/^\s*/);
  const indent = indentMatch ? indentMatch[0] : '  ';

  const pieces = keepProps.map(p => code.slice(p.start, p.end));
  const joined = '\n' + indent + pieces.join(',\n' + indent) + '\n';
  s.overwrite(open, close, joined);
  return s.toString();
}

async function main() {
  if (!fs.existsSync(apiDir)) {
    console.error(`src/api not found at: ${apiDir}`);
    process.exit(1);
  }

  const apiMap = await collectApiDefaultObjectMethods();
  const used = await collectUsedApiMethods();

  const report = [];
  let totalRemoved = 0;

  for (const [apiFile, meta] of apiMap.entries()) {
    if (!meta.hasDefaultObject || !meta.objectNode || meta.props.length === 0) continue;

    const usedSet = used.get(apiFile) || new Set();
    const keep = meta.props.filter(p => usedSet.has(p.name));
    const drop = meta.props.filter(p => !usedSet.has(p.name));

    if (drop.length === 0) continue;

    report.push({
      file: apiFile,
      removed: drop.map(d => d.name),
      kept: keep.map(k => k.name),
    });

    if (writeMode) {
      const newCode = rebuildObjectLiteral(meta.code, meta.objectNode, keep);
      await fsp.writeFile(apiFile, newCode, 'utf8');
      totalRemoved += drop.length;
    }
  }

  if (report.length === 0) {
    console.log('No unused API methods found on default-exported objects under src/api.');
    return;
  }

  for (const r of report) {
    const rel = path.relative(projectRoot, r.file);
    console.log(`${writeMode ? '[removed]' : '[unused]'} ${rel}`);
    console.log(`  - removed: ${r.removed.join(', ')}`);
    console.log(`  - kept: ${r.kept.length ? r.kept.join(', ') : '(none kept)'}`);
  }

  if (writeMode) {
    console.log(`Done. Removed ${totalRemoved} method(s) across ${report.length} file(s).`);
  } else {
    console.log('Dry run. To apply deletions, run with --write');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

