
import { Analyzer } from './analyzer';

// tslint:disable-next-line: no-require-imports
import { Expander, IGetMethod } from './expander';
import { Extractor } from './extractor';
import { LGTemplate } from './lgTemplate';
import { ReportEntry, StaticChecker } from './staticChecker';
import { TemplateEngine } from './templateEngine';

// tslint:disable-next-line: completed-docs
export class MSLGTool {
    public MergerMessages: ReportEntry[] = [];
    public MergedTemplates: Map<string, any> = new Map<string, any>();
    public NameCollisions: string[] = [];

    private Templates: LGTemplate[];

    public ValidateFile(lgFileContent: string): ReportEntry[] {
        let errors: ReportEntry[] = [];
        this.Templates = this.BuildTemplates(lgFileContent, errors);
        if (this.Templates !== undefined) {
            errors = errors.concat(this.RunStaticCheck(this.Templates));
            if (errors === undefined || errors.length === 0) {
                this.RunTemplateExtractor(this.Templates);
            }
        }

        return errors;
    }

    public GetTemplateVariables(templateName: string): string[] {
        const analyzer: Analyzer = new Analyzer(this.Templates);

        return analyzer.AnalyzeTemplate(templateName);
    }

    public ExpandTemplate(templateName: string, scope: any, methodBinder?: IGetMethod): string[] {
        const expander: Expander = new Expander(this.Templates, methodBinder);
        return expander.ExpandTemplate(templateName, scope);
    }

    private BuildTemplates(lgFileContent: string, initErrorMessages: ReportEntry[] = []): LGTemplate[] {
        try {
            const engine = TemplateEngine.fromText(lgFileContent);
            return engine.templates;
        } catch (e) {
            initErrorMessages.push(new ReportEntry(e.message));

            return undefined;
        }
    }

    // tslint:disable-next-line: max-line-length
    private RunStaticCheck(templates: LGTemplate[]): ReportEntry[] {
        const checker: StaticChecker = new StaticChecker(templates);

        return checker.Check();
    }

    private RunTemplateExtractor(lgtemplates: LGTemplate[]): void {
        const extractor: Extractor = new Extractor(lgtemplates);
        const templates: Map<string, any>[] = extractor.Extract();
        for (const item of templates) {
            const template: any = item.entries().next().value;
            if (this.MergedTemplates.has(template[0])) {
                this.NameCollisions.push(template[0]);
                if (this.MergedTemplates.get(template[0]) instanceof Map && template[1] instanceof Map) {
                    for (const condition of (template[1] as Map<string, string[]>)) {
                        const mergedCondtions  = this.MergedTemplates.get(template[0]) as Map<string, string[]>;
                        if (mergedCondtions.has(condition[0])) {
                            // tslint:disable-next-line: max-line-length
                            this.MergedTemplates.set(template[0], this.MergedTemplates.get(template[0]).set(condition[0], Array.from(new Set(mergedCondtions.get(condition[0]).concat(condition[1])))));
                        } else {
                            this.MergedTemplates.set(template[0], this.MergedTemplates.get(template[0]).set(condition[0], condition[1]));
                        }
                    }
                } else if (this.MergedTemplates.get(template[0]) instanceof Array && template[1] instanceof Array) {
                    this.MergedTemplates.set(template[0], Array.from(new Set(this.MergedTemplates.get(template[0]).concat(template[1]))));
                } else {
                    // tslint:disable-next-line: max-line-length
                    const mergeError: ReportEntry = new ReportEntry(`Template ${template[0]} occurred in both normal and condition templates`);
                    this.MergerMessages.push(mergeError);
                }
            } else {
                this.MergedTemplates.set(template[0], template[1]);
            }
        }
    }
}
