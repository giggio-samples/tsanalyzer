export interface CodeFix {
    name: string;
    resolves(arg: CodeFixOptions): boolean;
    description(arg: CodeFixOptions): string;
    apply(options: CodeFixOptions, fileName: string, actionName: string): ts.RefactorEditInfo | undefined;
}

export interface CodeFixOptions {
    log: (str: string) => void;
    targetNode: ts.Node;
    pluginCreateInfo: ts.server.PluginCreateInfo;
    diagnostics: ts.Diagnostic[];
}
