const { withGradleProperties } = require("expo/config-plugins");

module.exports = (config) => {
    return withGradleProperties(config, (config) => {
        // Set Kotlin version to 1.9.25 to match Compose Compiler requirement
        config.modResults.push({
            type: "property",
            key: "kotlin.version",
            value: "1.9.25",
        });
        // Suppress Kotlin version compatibility check as a fallback
        config.modResults.push({
            type: "property",
            key: "android.suppressKotlinVersionCompatibilityCheck",
            value: "true",
        });
        return config;
    });
};
