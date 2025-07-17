declare module '@material-ui/core/styles/createMuiTheme' {
    interface Theme {
        kale: {
            headers: {
                main: string;
            };
        };
    }
    interface ThemeOptions {
        kale?: {
            headers?: {
                main?: string;
            };
        };
    }
}
export declare const theme: import("@material-ui/core/styles").Theme;
