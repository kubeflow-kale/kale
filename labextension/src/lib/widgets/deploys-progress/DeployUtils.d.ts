/// <reference types="react" />
export default class DeployUtils {
    static color: {
        activeBg: string;
        alert: string;
        background: string;
        blue: string;
        disabledBg: string;
        divider: string;
        errorBg: string;
        errorText: string;
        foreground: string;
        graphBg: string;
        grey: string;
        inactive: string;
        lightGrey: string;
        lowContrast: string;
        secondaryText: string;
        separator: string;
        strong: string;
        success: string;
        successWeak: string;
        terminated: string;
        theme: string;
        themeDarker: string;
        warningBg: string;
        warningText: string;
        weak: string;
        canceled: string;
    };
    static getInfoBadge(title: string, content: any): JSX.Element;
    static getWarningBadge(title: string, content: any): JSX.Element;
}
