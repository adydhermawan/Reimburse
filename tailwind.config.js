/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: "#22D3EE", // Cyan
                "primary-dark": "#0891B2",
                "primary-light": "rgba(34,211,238,0.15)",
                background: "#0D1117", // Github Dark Dimmed style
                surface: "#161B22", // Card background
                "surface-elevated": "#1C2128", // Inputs, elevated cards
                text: "#FFFFFF",
                "text-secondary": "#8B949E",
                "text-muted": "#6E7681",
                success: "#10B981",
                warning: "#F59E0B",
                danger: "#EF4444",
                info: "#3B82F6",
            }
        },
    },
    plugins: [],
}
