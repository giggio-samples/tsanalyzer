import * as ts from 'typescript';
import * as ts_module from 'typescript/lib/tsserverlibrary';
import { CodeFix, CodeFixOptions } from './codeFix';
import { codeFixes as allCodeFixes } from './codeFixes';

let info!: ts_module.server.PluginCreateInfo;
const pluginName = 'giggio-sample-plugin';

function getApplicableRefactors(fileName: string,
  positionOrRange: number | ts.TextRange,
  userPreferences: ts_module.UserPreferences): ts.ApplicableRefactorInfo[] {
  log('Getting applicable refactorings.');
  const refactors = info.languageService.getApplicableRefactors(fileName, positionOrRange, userPreferences) || [];
  const codeFixes = getCodeFixes(fileName, positionOrRange);
  if (!codeFixes || codeFixes.fixes.length < 1) {
    log('No code fixes found.');
    return refactors;
  }
  const refactor = {
    name: `${pluginName}-refactor-info`,
    description: 'Code Fixes',
    actions: codeFixes.fixes.map(fix => ({
      name: fix.name,
      description: fix.description(codeFixes.options)
    }))
  };
  refactors.push(refactor);
  return refactors;
}

function getEditsForRefactor(fileName: string,
  formatOptions: ts.FormatCodeSettings,
  positionOrRange: number | ts.TextRange,
  refactorName: string,
  actionName: string,
  userPreferences: ts_module.UserPreferences): ts.RefactorEditInfo | undefined {
  log('Getting edits for refactor.');
  const codeFixes = getCodeFixes(fileName, positionOrRange);
  if (!codeFixes)
    return;
  const refactors = info.languageService.getEditsForRefactor(fileName,
    formatOptions, positionOrRange, refactorName, actionName, userPreferences);
  if (!codeFixes.options.targetNode)
    return refactors;
  const fix = allCodeFixes.find(theFix => theFix.name === actionName);
  if (!fix)
    return refactors;
  return fix.apply(codeFixes.options, fileName, actionName);
}

function getCodeFixes(
  fileName: string, positionOrRange: number | ts.TextRange): { fixes: CodeFix[], options: CodeFixOptions } | undefined {
  log('getting code fix');
  const program = info.languageService.getProgram();
  if (!program) return;
  const sourceFile = program.getSourceFile(fileName);
  if (!sourceFile) {
    log('SourceFile not found');
    return;
  }
  const start = positionOrRangeToNumber(positionOrRange);
  const targetNode = findChildContainingRange(sourceFile, positionOrRangeToRange(start + 1));
  if (!targetNode)
    return;
  const diagnostics = ts_module.getPreEmitDiagnostics(program, sourceFile).slice(0);
  const options: CodeFixOptions = { diagnostics, pluginCreateInfo: info, targetNode, log };
  const fixes = allCodeFixes.filter(fix => fix.resolves(options));
  if (!fixes || !fixes.length) {
    log('No fixes apply');
    return;
  }
  return { fixes, options };
}

function init(modules: { typescript: typeof ts_module }) {
  function create(anInfo: ts_module.server.PluginCreateInfo) {
    info = anInfo;
    log('created');
    const proxy: ts.LanguageService = Object.create(null);
    for (const k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
      const x = info.languageService[k];
      proxy[k] = <any>((...args: Array<{}>) => x ? x.apply(info.languageService, args) : undefined);
    }
    proxy.getApplicableRefactors = getApplicableRefactors;
    proxy.getEditsForRefactor = getEditsForRefactor;
    return proxy;
  }
  return { create };
}

function log(msg: string) {
  info.project.projectService.logger.info(`${pluginName} ${msg}`);
}

function findChildContainingRange(sourceFile: ts.SourceFile, r: ts.TextRange): ts.Node | undefined {
  function find(node: ts.Node): ts.Node | undefined {
    if (r.pos >= node.getStart() && r.end < node.getEnd())
      return ts.forEachChild(node, find) || node;
  }
  return find(sourceFile);
}

function positionOrRangeToNumber(positionOrRange: number | ts.TextRange): number {
  return typeof positionOrRange === 'number' ? positionOrRange : (positionOrRange as ts.TextRange).pos;
}

function positionOrRangeToRange(positionOrRange: number | ts.TextRange): ts.TextRange {
  return typeof positionOrRange === 'number' ? { pos: positionOrRange, end: positionOrRange } : positionOrRange;
}

export = init;
