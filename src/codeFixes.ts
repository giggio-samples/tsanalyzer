import { CodeFix } from './codeFix';
import { Const2let } from './const2letcodefix';
export const codeFixes: CodeFix[] = [new Const2let()];
