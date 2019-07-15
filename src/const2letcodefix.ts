import * as ts from 'typescript';
import { CodeFix, CodeFixOptions } from './codeFix';

export class Const2let implements CodeFix {
  name = 'const2let';
  resolves(options: CodeFixOptions): boolean {
    if (options.targetNode.kind !== ts.SyntaxKind.Identifier) {
      options.log('predicate false because child.kind does not match: ' + getKindName(options.targetNode.kind));
      return false;
    }
    if (options.diagnostics.find(d => d.code === 2588 && d.start === options.targetNode.getStart())) {
      return true;
    } else {
      options.log('predicate false because code and start do not match: '
        + options.diagnostics.map(d => `${d.code}|${d.start}`).reduce((p, curr) => `${p};${curr}`, ''));
      return false;
    }
  }

  description(options: CodeFixOptions) {
    return `Change "const ${options.targetNode.getText()}" to "let ${options.targetNode.getText()}"`;
  }

  apply(options: CodeFixOptions, fileName: string, actionName: string): ts.RefactorEditInfo | undefined {
    const program = options.pluginCreateInfo.languageService.getProgram();
    if (!program) return;
    const typeChecker = program.getTypeChecker();
    const symbol = typeChecker.getSymbolAtLocation(options.targetNode);
    if (!symbol) return;
    const constNode = symbol.declarations.map(d => {
      if (!ts.isVariableDeclaration(d)) return;
      const variableDeclarationList = d.parent;
      if (!ts.isVariableDeclarationList(variableDeclarationList)) return;
      const variableStatement = variableDeclarationList.parent;
      if (!ts.isVariableStatement(variableStatement)) return;
      const declarationList = variableStatement.declarationList;
      return declarationList.getChildren().find(node => node.kind === ts.SyntaxKind.ConstKeyword);
    })[0];
    if (!constNode) return;
    return {
      edits: [
        {
          fileName,
          textChanges: [
            {
              newText: 'let',
              span: {
                start: constNode.getLeadingTriviaWidth() + constNode.pos,
                length: constNode.getText().length
              }
            }
          ]
        }
      ]
    };
  }
}

function getKindName(kind: number | ts.Node): string {
  return (kind || kind === 0) ? getEnumKey(ts.SyntaxKind, (kind as ts.Node).kind || kind) : 'undefined';
}

export function getEnumKey(anEnum: any, value: any): string {
  for (const key in anEnum) {
    if (value === anEnum[key]) {
      return key;
    }
  }
  return '';
}
